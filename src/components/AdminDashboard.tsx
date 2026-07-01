import React, { useState, useEffect } from 'react';
import { ConsultationRequest } from '../types';
import { 
  saveConsultationsLocal, 
  getConsultationsLocal, 
  deleteConsultationLocal, 
  clearConsultationsLocal 
} from '../lib/indexedDb';
import { 
  Users, 
  Phone, 
  MapPin, 
  CalendarRange, 
  Clock, 
  Trash2, 
  Settings,
  Download,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  Plus,
  Globe,
  Lock,
  Loader2,
  FileText,
  Save,
  LogOut,
  KeyRound,
  RefreshCw,
  Info
} from 'lucide-react';

// Interfaces match the backend models
interface AllowedIp {
  ip: string;
  createdAt: string;
  lastLoginAt: string;
  memo: string;
}

interface AccessLog {
  timestamp: string;
  ip: string;
  deviceType: string;
  browser: string;
  success: boolean;
  action: string;
  details: string;
}

export default function AdminDashboard() {
  const [isOpen, setIsOpen] = useState(false);
  
  // Auth state
  const [isLogged, setIsLogged] = useState(false);
  const [isIpWhitelisted, setIsIpWhitelisted] = useState(false);
  const [isFetchingAuth, setIsFetchingAuth] = useState(true);
  const [clientIp, setClientIp] = useState('');
  
  // Dashboard records state
  const [requests, setRequests] = useState<ConsultationRequest[]>([]);
  const [allowedIps, setAllowedIps] = useState<AllowedIp[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // Active Tab: consultations, ips, logs
  const [activeTab, setActiveTab] = useState<'consultations' | 'ips' | 'logs'>('consultations');

  // Consultation Filters
  const [filter, setFilter] = useState<'all' | 'pending' | 'inprogress' | 'completed' | 'canceled'>('all');
  const [expandedMeta, setExpandedMeta] = useState<Record<string, boolean>>({});
  const [memoInputs, setMemoInputs] = useState<Record<string, string>>({});

  // Login inputs
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [emergencyPassword, setEmergencyPassword] = useState('');
  const [showEmergency, setShowEmergency] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [lockTimeLeft, setLockTimeLeft] = useState(0);

  // IP management inputs
  const [newIp, setNewIp] = useState('');
  const [newMemo, setNewMemo] = useState('');
  const [ipError, setIpError] = useState('');
  const [ipSuccessMsg, setIpSuccessMsg] = useState('');

  // Toast notification state
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Inline Confirmation states to bypass blocked window.confirm in sandbox iframes
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [deleteIpConfirm, setDeleteIpConfirm] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type });
  };

  // Auto-dismiss toast
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Lock timer countdown
  useEffect(() => {
    if (lockTimeLeft > 0) {
      const timer = setTimeout(() => {
        setLockTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [lockTimeLeft]);

  // Authenticated fetch wrapper
  const authFetch = async (url: string, options?: RequestInit) => {
    const token = localStorage.getItem('cruise_admin_token') || '';
    const headers = {
      ...options?.headers,
      'Authorization': `Bearer ${token}`
    };
    return fetch(url, { ...options, headers });
  };

  // Check auth token on mount
  const checkAuthToken = async () => {
    setIsFetchingAuth(true);
    const token = localStorage.getItem('cruise_admin_token');
    
    // Always fetch public current IP details
    try {
      const resMyIp = await fetch('/api/my-ip');
      if (resMyIp.ok) {
        const ipData = await resMyIp.json();
        setClientIp(ipData.ip);
      }
    } catch (e) {
      console.error('Failed to get public client IP info', e);
    }

    if (!token) {
      setIsLogged(false);
      setIsIpWhitelisted(false);
      setIsFetchingAuth(false);
      return;
    }

    try {
      const res = await authFetch('/api/admin/verify');
      const data = await res.json();
      if (res.ok && data.isLogged) {
        setIsLogged(true);
        setIsIpWhitelisted(data.isIpWhitelisted);
        if (data.detectedIp) {
          setClientIp(data.detectedIp);
        }
      } else {
        // Stale or invalid token
        localStorage.removeItem('cruise_admin_token');
        setIsLogged(false);
        setIsIpWhitelisted(false);
      }
    } catch (e) {
      console.error('Failed token verification, using offline modes if allowed', e);
    } finally {
      setIsFetchingAuth(false);
    }
  };

  useEffect(() => {
    checkAuthToken();

    // Check query params and pathname
    const params = new URLSearchParams(window.location.search);
    const isAdminPath = window.location.pathname === '/admin' || window.location.pathname.startsWith('/admin');
    if (params.get('admin') === 'true' || isAdminPath) {
      setIsOpen(true);
    }

    const handleToggle = () => {
      setIsOpen(prev => !prev);
    };
    window.addEventListener('toggle_admin_dashboard', handleToggle);
    return () => {
      window.removeEventListener('toggle_admin_dashboard', handleToggle);
    };
  }, []);

  // Sync data dynamically based on login and Whitelist status
  const loadDashboardData = async () => {
    if (!isLogged || !isIpWhitelisted) return;

    // 1. Fetch consultations
    try {
      const res = await authFetch('/api/admin/consultations');
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
        setIsOfflineMode(false);
        await saveConsultationsLocal(data);
      } else if (res.status === 403) {
        setIsIpWhitelisted(false);
      } else if (res.status === 401) {
        handleLogout();
      } else {
        throw new Error('Server issues loading consultations');
      }
    } catch (e) {
      console.error('Consultation fetch failed, reverting to local backup', e);
      setIsOfflineMode(true);
      const localData = await getConsultationsLocal();
      setRequests(localData);
    }

    // 2. Fetch IP List
    try {
      const resIps = await authFetch('/api/admin/ips');
      if (resIps.ok) {
        const data = await resIps.json();
        setAllowedIps(data);
      }
    } catch (e) {
      console.error('Failed to retrieve whitelisted IPs', e);
    }

    // 3. Fetch Access Logs
    try {
      const resLogs = await authFetch('/api/admin/logs');
      if (resLogs.ok) {
        const data = await resLogs.json();
        setAccessLogs(data);
      }
    } catch (e) {
      console.error('Failed to retrieve access logs', e);
    }
  };

  useEffect(() => {
    if (isOpen && isLogged && isIpWhitelisted) {
      loadDashboardData();
    }
  }, [isOpen, isLogged, isIpWhitelisted, activeTab]);

  // Subscribe to real-time submission events
  useEffect(() => {
    const handleUpdate = () => {
      if (isOpen && isLogged && isIpWhitelisted) {
        loadDashboardData();
      }
    };
    window.addEventListener('consultation_submitted', handleUpdate);
    return () => window.removeEventListener('consultation_submitted', handleUpdate);
  }, [isOpen, isLogged, isIpWhitelisted]);

  // Admin login request
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    if (!loginId.trim() || !loginPassword.trim()) {
      setLoginError('아이디와 비밀번호를 입력해 주세요.');
      setLoginLoading(false);
      return;
    }

    if (showEmergency && !emergencyPassword.trim()) {
      setLoginError('비상 비밀번호를 입력해 주세요.');
      setLoginLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: loginId.trim(),
          password: loginPassword,
          emergencyPassword: showEmergency ? emergencyPassword : undefined
        })
      });

      const data = await res.json();
      
      if (res.status === 429) {
        // IP rate limited/locked out
        const remaining = data.message?.match(/\d+초/) ? parseInt(data.message.match(/\d+/)[0]) : 600;
        setLockTimeLeft(remaining);
        setLoginError(data.message || '로그인 실패 5회로 인하여 10분간 시도가 차단됩니다.');
        setLoginLoading(false);
        return;
      }

      if (res.ok && data.success) {
        localStorage.setItem('cruise_admin_token', data.token);
        setIsLogged(true);
        setIsIpWhitelisted(data.isIpWhitelisted);
        if (data.detectedIp) {
          setClientIp(data.detectedIp);
        }
        
        // Clear login fields
        setLoginId('');
        setLoginPassword('');
        setEmergencyPassword('');
        setShowEmergency(false);
      } else {
        setLoginError(data.message || '아이디 또는 비밀번호가 잘못되었습니다.');
      }
    } catch (err) {
      setLoginError('서버 연결 중 문제가 발생했습니다. 네트워크 상태를 확인해 주세요.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Auxiliary: Register current client IP directly
  const handleWhitelistCurrentIp = async () => {
    try {
      const res = await authFetch('/api/admin/whitelist-current-ip', {
        method: 'POST'
      });
      if (res.ok) {
        showToast('현재 IP가 안전하게 허용 목록에 추가되었습니다.', 'success');
        setIsIpWhitelisted(true);
        loadDashboardData();
      } else {
        const data = await res.json();
        showToast(data.error || 'IP 등록 처리에 실패했습니다.', 'error');
      }
    } catch (e) {
      showToast('서버 응답 오류로 IP 등록에 실패했습니다.', 'error');
    }
  };

  // Add custom IP with memo
  const handleAddIp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIpError('');
    setIpSuccessMsg('');

    const cleanIp = newIp.trim();
    if (!cleanIp) {
      setIpError('추가할 IP 주소를 입력해 주세요.');
      return;
    }

    // IPv4 / IPv6 validation
    const ipv4Regex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
    const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;

    const isValid = cleanIp === 'localhost' || ipv4Regex.test(cleanIp) || ipv6Regex.test(cleanIp);
    if (!isValid) {
      setIpError('올바른 IP 주소 형식을 입력해 주세요.');
      return;
    }

    if (allowedIps.some(item => item.ip === cleanIp)) {
      setIpError('이미 등록된 IP 주소입니다.');
      return;
    }

    try {
      const res = await authFetch('/api/admin/ips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: cleanIp, memo: newMemo.trim() || '수동 추가' })
      });
      const data = await res.json();
      if (res.ok) {
        setAllowedIps(data.allowedIps || []);
        setNewIp('');
        setNewMemo('');
        showToast(`IP 주소 [${cleanIp}]가 정상 추가되었습니다.`, 'success');
        loadDashboardData();
      } else {
        setIpError(data.error || 'IP 추가 등록에 실패했습니다.');
      }
    } catch (err) {
      setIpError('서버 통신 실패로 등록에 실패했습니다.');
    }
  };

  // Delete manual IP
  const handleDeleteIp = async (ipToDelete: string) => {
    setIpError('');
    setIpSuccessMsg('');

    if (allowedIps.length <= 1) {
      setIpError('최소 1개 이상의 허용 IP 주소가 등록되어 있어야 합니다.');
      showToast('최소 1개 이상의 허용 IP 주소가 등록되어 있어야 합니다.', 'error');
      return;
    }

    try {
      const res = await authFetch(`/api/admin/ips/${encodeURIComponent(ipToDelete)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok) {
        setAllowedIps(data.allowedIps || []);
        showToast('IP 주소가 정상적으로 허용 목록에서 제거되었습니다.', 'success');
        // If own IP was deleted, refresh state
        if (ipToDelete === clientIp) {
          checkAuthToken();
        } else {
          loadDashboardData();
        }
      } else {
        setIpError(data.error || 'IP 삭제에 실패했습니다.');
        showToast(data.error || 'IP 삭제에 실패했습니다.', 'error');
      }
    } catch (e) {
      setIpError('서버 통신 오류로 삭제에 실패했습니다.');
      showToast('서버 통신 오류로 삭제에 실패했습니다.', 'error');
    }
  };

  // Log out session
  const handleLogout = () => {
    localStorage.removeItem('cruise_admin_token');
    setIsLogged(false);
    setIsIpWhitelisted(false);
    setRequests([]);
    setAllowedIps([]);
    setAccessLogs([]);
    setIsOpen(false);
    showToast('관리자 세션에서 안전하게 로그아웃되었습니다.', 'info');
  };

  // Handle updates on consultations status
  const handleUpdateStatus = async (id: string, status: 'pending' | 'inprogress' | 'completed' | 'canceled') => {
    if (isOfflineMode) {
      showToast('현재 오프라인 상태(서버 데이터 미연결)이므로 상태를 변경할 수 없습니다.', 'error');
      return;
    }
    try {
      const res = await authFetch('/api/admin/consultations/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
      if (res.ok) {
        const next = requests.map(r => r.id === id ? { ...r, status } : r);
        setRequests(next);
        await saveConsultationsLocal(next);
        showToast('진행 상태가 성공적으로 변경되었습니다.', 'success');
      } else {
        showToast('진행상태 변경 권한이 없거나 실패했습니다.', 'error');
      }
    } catch (e) {
      showToast('서버 연결 실패로 상태 변경에 실패했습니다.', 'error');
    }
  };

  // Handle consultation memo saves
  const handleUpdateMemo = async (id: string) => {
    if (isOfflineMode) {
      showToast('현재 오프라인 상태(서버 데이터 미연결)이므로 메모를 저장할 수 없습니다.', 'error');
      return;
    }
    const memoValue = memoInputs[id] !== undefined ? memoInputs[id] : '';
    try {
      const res = await authFetch('/api/admin/consultations/memo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, memo: memoValue })
      });
      if (res.ok) {
        const next = requests.map(r => r.id === id ? { ...r, adminMemo: memoValue } : r);
        setRequests(next);
        await saveConsultationsLocal(next);
        showToast('상담 메모가 정상 저장되었습니다.', 'success');
      } else {
        showToast('메모 저장 권한이 없거나 오류가 발생했습니다.', 'error');
      }
    } catch (e) {
      showToast('서버 연결 실패로 메모 저장에 실패했습니다.', 'error');
    }
  };

  // Handle single consultation deletion
  const handleDelete = async (id: string) => {
    if (isOfflineMode) {
      showToast('현재 오프라인 상태(서버 데이터 미연결)이므로 삭제할 수 없습니다.', 'error');
      return;
    }
    try {
      const res = await authFetch(`/api/admin/consultations/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setRequests(prev => prev.filter(r => r.id !== id));
        await deleteConsultationLocal(id);
        showToast('상담 내역이 삭제되었습니다.', 'success');
      } else {
        showToast('삭제 처리 권한이 없거나 처리에 실패했습니다.', 'error');
      }
    } catch (e) {
      showToast('서버 연결 실패로 상담 기록 삭제에 실패했습니다.', 'error');
    }
  };

  // Clear all database records
  const handleClearAll = async () => {
    if (isOfflineMode) {
      showToast('현재 오프라인 상태(서버 데이터 미연결)이므로 초기화할 수 없습니다.', 'error');
      return;
    }
    try {
      const res = await authFetch('/api/admin/consultations/clear', {
        method: 'POST'
      });
      if (res.ok) {
        setRequests([]);
        await clearConsultationsLocal();
        showToast('전체 상담 신청 대장이 초기화되었습니다.', 'success');
      } else {
        showToast('초기화 권한이 없거나 오류가 발생했습니다.', 'error');
      }
    } catch (e) {
      showToast('서버 통신 실패로 데이터 초기화가 실패했습니다.', 'error');
    }
  };

  // Export consultations to spreadsheet format
  const handleDownloadCSV = () => {
    if (requests.length === 0) {
      showToast('다운로드할 상담 신청 데이터가 존재하지 않습니다.', 'error');
      return;
    }
    
    let csvContent = '\uFEFF'; // BOM for Excel Korean support
    csvContent += '접수ID,성함,연락처,거주지,희망출발시기,희망인원,선택상품,상담희망시간,메모,접수일시,진행상태,관리자메모\n';
    
    requests.forEach(r => {
      const statusText = 
        r.status === 'pending' ? '미확인' : 
        r.status === 'inprogress' ? '상담중' : 
        r.status === 'completed' ? '완료' : '상담취소';
      const cleanMsg = r.message ? r.message.replace(/,/g, ' ').replace(/\n/g, ' ') : '';
      const cleanMemo = r.adminMemo ? r.adminMemo.replace(/,/g, ' ').replace(/\n/g, ' ') : '';
      csvContent += `${r.id},${r.name},${r.contact},${r.location},${r.desiredPeriod},${r.travelerCount}명,${r.selectedProduct},${r.availableTime},${cleanMsg},${r.submittedAt},${statusText},${cleanMemo}\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `온국민크루즈_상담신청대장_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sortedRequests = [...requests].sort((a, b) => {
    const tA = parseInt(a.id.replace('REQ-', '')) || 0;
    const tB = parseInt(b.id.replace('REQ-', '')) || 0;
    return tB - tA;
  });

  const filteredRequests = sortedRequests.filter(r => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  const toggleMeta = (id: string) => {
    setExpandedMeta(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // If the admin dashboard is not explicitly open, render absolutely nothing
  if (!isOpen) {
    return null;
  }

  // Rendering Loader State
  if (isFetchingAuth) {
    return (
      <div className="py-12 flex flex-col justify-center items-center text-slate-400 gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-[#D4AF37]" />
        <span className="text-xs font-bold tracking-wider">보안 네트워크 통신 확인 중...</span>
      </div>
    );
  }

  // Visual layout for Unauthenticated state
  if (!isLogged) {
    return (
      <div className="mt-8 border-t border-slate-200 pt-8 pb-10">
        <div className="flex flex-col items-center gap-1.5 mb-6">
          <button
            type="button"
            id="btn-toggle-admin-login"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0A1E3F] hover:bg-slate-900 text-[#D4AF37] text-xs md:text-sm font-extrabold border-2 border-[#D4AF37]/50 shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Settings className="h-4 w-4 animate-spin" style={{ animationDuration: '8s' }} />
            <span>{isOpen ? '로그인 폼 닫기' : '관리자 모드 접속'}</span>
          </button>
          <span className="text-[10px] text-slate-400 font-semibold">
            접속 IP: {clientIp || '보안 로딩중'}
          </span>
        </div>

        {isOpen && (
          <div className="max-w-md mx-auto mx-4 bg-white border border-slate-200/80 p-6 md:p-8 rounded-3xl shadow-xl space-y-6 animate-in slide-in-from-bottom-5 duration-200">
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 rounded-2xl bg-slate-50 border border-slate-100 text-[#0A1E3F]">
                <Lock className="h-6 w-6 text-[#C5A028]" />
              </div>
              <h3 className="text-lg font-extrabold text-[#0A1E3F]">관리자 보안 인증</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                인가된 관리자 계정 정보가 일치해야 대장에 접근하실 수 있습니다.
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 block">관리자 아이디</label>
                <input
                  id="login-id-input"
                  type="text"
                  required
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="아이디를 입력해 주세요"
                  className="w-full text-xs md:text-sm px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-[#0A1E3F]/40 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 block">비밀번호</label>
                <input
                  id="login-password-input"
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="비밀번호를 입력해 주세요"
                  className="w-full text-xs md:text-sm px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-[#0A1E3F]/40 font-medium"
                />
              </div>

              {/* Emergency Switch (Bypass when IP is dynamic) */}
              <div className="pt-1.5">
                <label className="flex items-center gap-2 cursor-pointer group select-none">
                  <input
                    id="checkbox-emergency-mode"
                    type="checkbox"
                    checked={showEmergency}
                    onChange={(e) => setShowEmergency(e.target.checked)}
                    className="rounded border-slate-300 text-[#0A1E3F] focus:ring-[#0A1E3F]/40 h-4 w-4"
                  />
                  <span className="text-xs font-bold text-slate-500 group-hover:text-slate-800 transition-colors">
                    비상 로그인 추가 설정 (유동 IP 우회 등록)
                  </span>
                </label>
              </div>

              {showEmergency && (
                <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200/60 space-y-2 animate-in slide-in-from-top-2 duration-150">
                  <div className="flex items-start gap-1.5">
                    <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-amber-700 leading-normal font-semibold">
                      기기가 꺼졌다 켜져 현재 IP 주소({clientIp})가 허용된 목록에 없어 진입이 불가할 경우 사용하는 특수 기능입니다. 아이디/패스워드와 함께 비상 코드가 일치하면 현재 IP 주소가 허용 목록에 자동 등록되어 우회 진입합니다.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-amber-800 block">비상 비밀번호 (Emergency Code)</label>
                    <input
                      id="emergency-password-input"
                      type="password"
                      value={emergencyPassword}
                      onChange={(e) => setEmergencyPassword(e.target.value)}
                      placeholder="비상 비밀번호(2차 코드)를 입력하세요"
                      className="w-full text-xs px-3 py-2 border border-amber-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 font-mono font-bold"
                    />
                  </div>
                </div>
              )}

              {loginError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-3 text-xs font-bold flex items-start gap-2 leading-relaxed">
                  <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              {lockTimeLeft > 0 && (
                <div className="bg-red-100 text-red-800 border border-red-300 p-3 rounded-2xl text-xs font-bold text-center">
                  차단 해제까지 남은 시간: {lockTimeLeft}초
                </div>
              )}

              <button
                type="submit"
                id="btn-login-submit"
                disabled={loginLoading || lockTimeLeft > 0}
                className="w-full bg-[#0A1E3F] hover:bg-slate-900 disabled:bg-slate-300 text-[#D4AF37] disabled:text-slate-500 py-3 rounded-xl text-xs md:text-sm font-extrabold flex justify-center items-center gap-1.5 cursor-pointer border border-[#D4AF37]/40 shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all"
              >
                {loginLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-[#D4AF37]" />
                    <span>보안 인증을 진행하고 있습니다...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="h-4 w-4" />
                    <span>로그인 및 보안 승인</span>
                  </>
                )}
              </button>
            </form>

            <div className="text-center">
              <span className="text-[10px] text-slate-400 font-medium">
                IP Whitelist Firewall Protected ● All rights reserved
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Visual layout when Logged-In, but current IP is NOT whitelisted
  if (!isIpWhitelisted) {
    return (
      <div className="mt-8 border-t border-slate-200 pt-8 pb-10">
        <div className="max-w-md mx-auto mx-4 bg-amber-50 border border-amber-200 p-6 md:p-8 rounded-3xl shadow-xl text-center space-y-6 animate-in slide-in-from-bottom-5 duration-200">
          <div className="inline-flex p-3 rounded-2xl bg-amber-100 text-amber-700">
            <ShieldAlert className="h-7 w-7" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-extrabold text-amber-900">현재 IP가 허용 목록에 없습니다.</h3>
            <p className="text-xs text-amber-800 leading-relaxed font-medium">
              로그인은 정상 처리되었으나, 현재 귀하의 임시 접속 IP 주소인 <br />
              <strong className="font-mono text-sm underline bg-white px-2 py-0.5 rounded border border-amber-200 mt-1 inline-block text-[#0A1E3F]">{clientIp || 'unknown'}</strong> <br />
              는 현재 허용된 관리자 IP 목록에 등재되어 있지 않습니다.
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-amber-200/50 text-left space-y-2 text-[11px] text-slate-500 font-semibold leading-relaxed">
            <p className="text-[#0A1E3F] font-bold">💡 해결 방법:</p>
            <p>1. 아래 <strong className="text-amber-700">“현재 IP 허용하기”</strong> 버튼을 클릭하여 본인의 계정 로그인 세션 권한을 이용해 현재 IP를 허용 목록에 직접 즉시 추가할 수 있습니다.</p>
            <p>2. 비상인증 코드가 부여되어 있다면 비상 로그인을 수행하여도 자동 등록됩니다.</p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              id="btn-whitelist-current-ip"
              onClick={handleWhitelistCurrentIp}
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2.5 rounded-xl text-xs font-bold shadow transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              현재 IP 허용하기
            </button>
            <button
              type="button"
              id="btn-logout-fallback"
              onClick={handleLogout}
              className="px-4 bg-white hover:bg-slate-100 border border-slate-300 text-slate-600 rounded-xl text-xs font-bold transition-transform hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1"
            >
              <LogOut className="h-4 w-4" />
              <span>로그아웃</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Visual layout for fully logged-in and authorized IP dashboard
  return (
    <div className="mt-8 border-t border-slate-200 pt-6">
      
      {/* Whitelisted Header Controller */}
      <div className="flex flex-col items-center gap-2 mb-6">
        <div className="flex flex-wrap justify-center items-center gap-2">
          <button
            type="button"
            id="btn-toggle-admin-panel"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0A1E3F] hover:bg-slate-900 text-[#D4AF37] text-xs md:text-sm font-extrabold border-2 border-[#D4AF37]/50 shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Settings className="h-4 w-4 animate-spin" style={{ animationDuration: '6s' }} />
            <span>{isOpen ? '관리자 모드 닫기' : '관리 컨트롤 타워 열기 (접수 대장)'}</span>
          </button>

          <button
            type="button"
            id="btn-logout-direct"
            onClick={handleLogout}
            className="flex items-center gap-1 px-3.5 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-extrabold transition-all hover:scale-105 active:scale-95 cursor-pointer"
            title="관리자 세션 로그아웃"
          >
            <LogOut className="h-4 w-4" />
            <span>로그아웃</span>
          </button>
        </div>

        <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full shadow-sm animate-pulse">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
          <span>보안 검증 통과 완료 (허용된 접속 IP: {clientIp})</span>
        </span>
      </div>

      {isOpen && (
        <div className="mx-6 bg-slate-50 border border-slate-200 rounded-3xl p-5 shadow-inner space-y-6 animate-in slide-in-from-bottom-5 duration-200">
          
          {/* Dashboard Menu Tabs */}
          <div className="grid grid-cols-3 gap-1 bg-slate-200/60 p-1 rounded-2xl border border-slate-300/30">
            <button
              type="button"
              id="tab-consultations"
              onClick={() => setActiveTab('consultations')}
              className={`py-2.5 rounded-xl text-xs md:text-sm font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'consultations'
                  ? 'bg-white text-[#0A1E3F] shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
              }`}
            >
              <FileText className="h-4 w-4 text-[#C5A028]" />
              <span>상담 신청 대장</span>
            </button>
            <button
              type="button"
              id="tab-ips"
              onClick={() => setActiveTab('ips')}
              className={`py-2.5 rounded-xl text-xs md:text-sm font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'ips'
                  ? 'bg-white text-[#0A1E3F] shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
              }`}
            >
              <Globe className="h-4 w-4 text-[#C5A028]" />
              <span>IP 접속 관리</span>
            </button>
            <button
              type="button"
              id="tab-logs"
              onClick={() => setActiveTab('logs')}
              className={`py-2.5 rounded-xl text-xs md:text-sm font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'logs'
                  ? 'bg-white text-[#0A1E3F] shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
              }`}
            >
              <Clock className="h-4 w-4 text-[#C5A028]" />
              <span>접속 보안 기록</span>
            </button>
          </div>

          {/* TAB 1: Consultations Management */}
          {activeTab === 'consultations' && (
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4 animate-in fade-in duration-150" id="section-consultation-manager">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h4 className="text-sm md:text-base font-extrabold text-[#0A1E3F] flex items-center gap-1.5">
                    <Lock className="h-4.5 w-4.5 text-[#C5A028]" />
                    <span>실시간 접수 리스트 (IP 검증 완료)</span>
                    <span className="text-xs bg-[#D4AF37]/20 text-[#0A1E3F] border border-[#D4AF37]/30 px-2 py-0.5 rounded font-bold">
                      총 {requests.length}건
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">※ 외부 비인가 사용자가 URL을 탈취해도 백엔드 ID/PW &amp; IP 보안층에 의해 대장 조회가 절대 불가합니다.</p>
                </div>
                
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    id="btn-admin-download-csv"
                    onClick={handleDownloadCSV}
                    className="flex items-center gap-1 bg-white hover:bg-slate-100 text-[#0A1E3F] font-bold text-xs py-1.5 px-2.5 border border-slate-300 rounded-lg shadow-sm cursor-pointer shrink-0"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>엑셀 저장</span>
                  </button>
                  {showClearConfirm ? (
                    <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 p-1 rounded-lg animate-in slide-in-from-right-2 duration-150 shrink-0">
                      <span className="text-[10px] text-red-700 font-extrabold whitespace-nowrap">영구 초기화 진행?</span>
                      <button
                        type="button"
                        id="btn-clear-confirm-yes"
                        onClick={async () => {
                          await handleClearAll();
                          setShowClearConfirm(false);
                        }}
                        className="px-1.5 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold hover:bg-red-700 transition-colors shrink-0 cursor-pointer"
                      >
                        예
                      </button>
                      <button
                        type="button"
                        id="btn-clear-confirm-no"
                        onClick={() => setShowClearConfirm(false)}
                        className="px-1.5 py-0.5 rounded bg-white border border-slate-300 text-slate-600 text-[10px] font-bold hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
                      >
                        취소
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      id="btn-admin-clear"
                      onClick={() => setShowClearConfirm(true)}
                      className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs py-1.5 px-2.5 border border-red-200 rounded-lg cursor-pointer shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>전체 초기화</span>
                    </button>
                  )}
                </div>
              </div>
              
              {isOfflineMode && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3.5 text-xs md:text-sm font-bold flex items-center gap-2 animate-pulse">
                  <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                  <span>현재 서버 데이터를 불러오지 못해 로컬 백업 데이터를 표시 중입니다.</span>
                </div>
              )}

              {/* Filters */}
              <div className="flex flex-wrap gap-1.5">
                {(['all', 'pending', 'inprogress', 'completed', 'canceled'] as const).map((status) => {
                  const label = 
                    status === 'all' ? '전체' : 
                    status === 'pending' ? '미확인' : 
                    status === 'inprogress' ? '상담중' : 
                    status === 'completed' ? '완료' : '상담취소';
                  const isSelected = filter === status;
                  return (
                    <button
                      key={status}
                      type="button"
                      id={`btn-filter-${status}`}
                      onClick={() => setFilter(status)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-[#0A1E3F] text-[#D4AF37]' 
                          : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Requests List */}
              {filteredRequests.length === 0 ? (
                <div className="py-12 bg-slate-50 rounded-2xl border border-slate-200 text-center text-slate-400 font-medium">
                  <AlertCircle className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm">해당 조건에 부합하는 상담 신청 기록이 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                  {filteredRequests.map((req) => (
                    <div key={req.id} id={`admin-card-${req.id}`} className="bg-slate-50/50 p-4 rounded-xl border border-slate-200 space-y-3 relative">
                      
                      {/* Title Bar */}
                      <div className="flex justify-between items-start gap-2 border-b border-slate-200/50 pb-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm md:text-base font-extrabold text-[#0A1E3F]">{req.name}</span>
                            <span className="text-[10px] text-slate-400 bg-white border px-1.5 py-0.5 rounded font-mono">{req.id}</span>
                          </div>
                          <span className="text-xs text-slate-400 font-medium">접수 일자: {req.submittedAt}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <select
                            value={req.status}
                            id={`select-status-${req.id}`}
                            onChange={(e) => handleUpdateStatus(req.id, e.target.value as any)}
                            className={`text-xs font-bold px-2 py-1 rounded-lg border cursor-pointer focus:outline-none ${
                              req.status === 'pending' 
                                ? 'bg-yellow-50 border-yellow-200 text-yellow-700' 
                                : req.status === 'inprogress'
                                ? 'bg-sky-50 border-sky-200 text-sky-700'
                                : req.status === 'completed'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                : 'bg-slate-100 border-slate-300 text-slate-500'
                            }`}
                          >
                            <option value="pending">미확인</option>
                            <option value="inprogress">상담중</option>
                            <option value="completed">완료</option>
                            <option value="canceled">상담취소</option>
                          </select>

                          {deleteConfirmId === req.id ? (
                            <div className="flex items-center gap-1 bg-red-50 border border-red-200 p-1 rounded-lg animate-in fade-in duration-100 shrink-0">
                              <span className="text-[10px] text-red-700 font-extrabold px-1 whitespace-nowrap">정말 삭제?</span>
                              <button
                                type="button"
                                id={`btn-delete-confirm-yes-${req.id}`}
                                onClick={async () => {
                                  await handleDelete(req.id);
                                  setDeleteConfirmId(null);
                                }}
                                className="px-1.5 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold hover:bg-red-700 transition-colors cursor-pointer"
                              >
                                예
                              </button>
                              <button
                                type="button"
                                id={`btn-delete-confirm-no-${req.id}`}
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-1.5 py-0.5 rounded bg-white border border-slate-300 text-slate-600 text-[10px] font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                              >
                                취소
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              id={`btn-delete-${req.id}`}
                              onClick={() => setDeleteConfirmId(req.id)}
                              className="p-1 rounded bg-red-50 hover:bg-red-100 text-red-500 border border-red-200 cursor-pointer shrink-0"
                              title="상담내역 삭제"
                            >
                              <Trash2 className="h-4.5 w-4.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Specifications Grid */}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-slate-600 font-semibold bg-white p-2.5 rounded-xl border border-slate-150">
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          <span>연락처: <strong className="text-slate-800">{req.contact}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          <span>거주지: <strong className="text-slate-800">{req.location}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5 col-span-2">
                          <span className="text-slate-400 font-bold shrink-0">선택상품:</span>
                          <strong className="text-[#0A1E3F] font-bold">{req.selectedProduct}</strong>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CalendarRange className="h-3.5 w-3.5 text-slate-400" />
                          <span>희망시기: <strong className="text-slate-800">{req.desiredPeriod}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-slate-400" />
                          <span>희망인원: <strong className="text-slate-800">{req.travelerCount}명</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5 col-span-2">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <span>희망시간: <strong className="text-slate-800">{req.availableTime}</strong></span>
                        </div>
                      </div>

                      {/* Message if any */}
                      {req.message && (
                        <div className="bg-amber-50/40 p-3 rounded-xl border border-amber-100/60 text-xs md:text-sm text-slate-700 font-normal">
                          <span className="font-bold text-[#C5A028] block mb-1">✍️ 상세 문의내용:</span>
                          <p className="whitespace-pre-line leading-relaxed">{req.message}</p>
                        </div>
                      )}

                      {/* Admin Memo Editor */}
                      <div className="bg-slate-100/40 p-3 rounded-xl border border-slate-200/80 space-y-2">
                        <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-slate-400" />
                          <span>관리자 메모</span>
                        </span>
                        <div className="flex gap-2">
                          <textarea
                            id={`textarea-memo-${req.id}`}
                            value={memoInputs[req.id] !== undefined ? memoInputs[req.id] : (req.adminMemo || '')}
                            onChange={(e) => setMemoInputs(prev => ({ ...prev, [req.id]: e.target.value }))}
                            placeholder="상담 이력 및 수동 조치 메모 사항을 작성해 주세요"
                            rows={2}
                            className="flex-1 text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-[#0A1E3F]/40 resize-none leading-relaxed text-slate-700 font-medium"
                          />
                          <button
                            type="button"
                            id={`btn-save-memo-${req.id}`}
                            onClick={() => handleUpdateMemo(req.id)}
                            className="bg-[#0A1E3F] hover:bg-slate-950 text-[#D4AF37] px-3.5 py-1.5 rounded-xl text-xs font-bold flex flex-col justify-center items-center gap-1 cursor-pointer border border-[#D4AF37]/30 shrink-0 self-stretch hover:scale-[1.02] active:scale-[0.98] transition-all"
                            title="메모 저장"
                          >
                            <Save className="h-4 w-4" />
                            <span>저장</span>
                          </button>
                        </div>
                      </div>

                      {/* Metadata Section */}
                      <div className="bg-slate-100/60 rounded-xl p-3 border border-slate-200 text-xs text-slate-500 font-semibold space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span className="flex items-center gap-1">
                              <strong className="text-slate-400">IP:</strong> 
                              <span className="text-slate-700 font-mono font-bold">{req.submitMeta?.ipAddress || '정보 없음'}</span>
                            </span>
                            <span className="text-slate-300">|</span>
                            <span className="flex items-center gap-1">
                              <strong className="text-slate-400">기기:</strong> 
                              <span className="text-slate-700 font-bold">{req.submitMeta?.deviceType || '정보 없음'}</span>
                            </span>
                            <span className="text-slate-300">|</span>
                            <span className="flex items-center gap-1">
                              <strong className="text-slate-400">브라우저:</strong> 
                              <span className="text-slate-700 font-bold">{req.submitMeta?.browser || '정보 없음'}</span>
                            </span>
                            <span className="text-slate-300">|</span>
                            <span className="flex items-center gap-1">
                              <strong className="text-slate-400">접수일시:</strong> 
                              <span className="text-slate-700 font-bold">{req.submitMeta?.submittedAt || req.submittedAt || '정보 없음'}</span>
                            </span>
                          </div>

                          <button
                            type="button"
                            id={`btn-toggle-meta-${req.id}`}
                            onClick={() => toggleMeta(req.id)}
                            className="text-[11px] font-bold text-[#0A1E3F] hover:underline flex items-center gap-0.5 cursor-pointer shrink-0"
                          >
                            {expandedMeta[req.id] ? '상세 정보 접기 ▲' : '상세 정보 보기 ▼'}
                          </button>
                        </div>

                        {/* Expanded full details */}
                        {expandedMeta[req.id] && (
                          <div className="mt-2.5 pt-2.5 border-t border-slate-200/60 grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] md:text-xs text-slate-600 animate-in slide-in-from-top-1 duration-150">
                            <div>
                              <span className="text-slate-400 font-bold">운영체제 (OS):</span>{' '}
                              <strong className="text-slate-800">{req.submitMeta?.os || '정보 없음'}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 font-bold">접속페이지:</span>{' '}
                              <strong className="text-slate-800 font-mono break-all">{req.submitMeta?.pageUrl || '정보 없음'}</strong>
                            </div>
                            <div className="col-span-1 md:col-span-2 bg-white/80 p-2 rounded-lg border border-slate-150">
                              <span className="text-slate-400 font-bold block mb-1">User-Agent (원본):</span>
                              <span className="font-mono text-[10px] text-slate-500 break-all select-all leading-normal">
                                {req.submitMeta?.userAgent || '정보 없음'}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Allowed IP management with detailed memo, register dates & activity */}
          {activeTab === 'ips' && (
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4 animate-in fade-in duration-150" id="section-allowed-ips">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h4 className="text-sm md:text-base font-extrabold text-[#0A1E3F] flex items-center gap-1.5">
                    <Globe className="h-4.5 w-4.5 text-[#C5A028]" />
                    <span>IP 접속 관리 (allowedAdminIps)</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">대장 접근 권한을 허용할 IP와 식별용 메모(예: 집, 사무실)를 등록하고 관리합니다.</p>
                </div>
                <button
                  type="button"
                  onClick={loadDashboardData}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-all flex items-center gap-1"
                  title="IP 목록 동기화 새로고침"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span className="text-xs font-semibold">동기화</span>
                </button>
              </div>

              {/* IP list table */}
              <div className="overflow-x-auto rounded-xl border border-slate-150">
                <table className="w-full text-xs md:text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 font-extrabold border-b border-slate-150">
                    <tr>
                      <th className="p-3">상태</th>
                      <th className="p-3">IP 주소</th>
                      <th className="p-3">등록일시</th>
                      <th className="p-3">최근 승인일</th>
                      <th className="p-3">설명 (메모)</th>
                      <th className="p-3 text-right">삭제</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {allowedIps.map((item) => {
                      const isMyIp = item.ip === clientIp;
                      return (
                        <tr key={item.ip} className={`hover:bg-slate-50/50 ${isMyIp ? 'bg-emerald-50/20' : ''}`}>
                          <td className="p-3 whitespace-nowrap">
                            {isMyIp ? (
                              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-emerald-200">
                                현재 접속중
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-500 text-[10px] font-bold px-2.5 py-1 rounded-full">
                                승인 허용됨
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                            {item.ip}
                          </td>
                          <td className="p-3 text-slate-500 text-xs whitespace-nowrap">
                            {item.createdAt}
                          </td>
                          <td className="p-3 text-slate-500 text-xs whitespace-nowrap">
                            {item.lastLoginAt || '기록 없음'}
                          </td>
                          <td className="p-3 font-bold text-slate-600 text-xs">
                            {item.memo || '설명 없음'}
                          </td>
                          <td className="p-3 text-right">
                            {deleteIpConfirm === item.ip ? (
                              <div className="flex items-center justify-end gap-1 animate-in fade-in duration-100 shrink-0">
                                <span className="text-[10px] text-red-700 font-extrabold whitespace-nowrap">정말 삭제?</span>
                                <button
                                  type="button"
                                  id={`btn-delete-ip-yes-${item.ip}`}
                                  onClick={async () => {
                                    await handleDeleteIp(item.ip);
                                    setDeleteIpConfirm(null);
                                  }}
                                  className="px-1.5 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold hover:bg-red-700 transition-colors cursor-pointer"
                                >
                                  예
                                </button>
                                <button
                                  type="button"
                                  id={`btn-delete-ip-no-${item.ip}`}
                                  onClick={() => setDeleteIpConfirm(null)}
                                  className="px-1.5 py-0.5 rounded bg-white border border-slate-300 text-slate-600 text-[10px] font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                                >
                                  취소
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                id={`btn-delete-ip-${item.ip}`}
                                onClick={() => setDeleteIpConfirm(item.ip)}
                                disabled={allowedIps.length <= 1}
                                className={`p-1.5 rounded-lg border inline-flex items-center justify-center shrink-0 ${
                                  allowedIps.length <= 1 
                                    ? 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed' 
                                    : 'bg-red-50 hover:bg-red-100 text-red-500 border-red-200 cursor-pointer'
                                }`}
                                title="IP 허용 해제"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Feedback messages */}
              {ipError && (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-xs md:text-sm font-semibold flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{ipError}</span>
                </div>
              )}
              {ipSuccessMsg && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-xl p-3 text-xs md:text-sm font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  <span>{ipSuccessMsg}</span>
                </div>
              )}

              {/* New IP with custom memo form */}
              <form onSubmit={handleAddIp} className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-3">
                <span className="text-xs font-extrabold text-[#0A1E3F] block">새로운 신규 IP 주소 허용 등록</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 block">IP 주소</label>
                    <input
                      id="input-new-ip"
                      type="text"
                      value={newIp}
                      onChange={(e) => setNewIp(e.target.value)}
                      placeholder="IP 주소 (예: 211.234.56.78)"
                      className="w-full text-xs md:text-sm px-3.5 py-2.5 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#0A1E3F]/40 font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 block">IP 구분 및 메모 (식별용)</label>
                    <input
                      id="input-new-ip-memo"
                      type="text"
                      value={newMemo}
                      onChange={(e) => setNewMemo(e.target.value)}
                      placeholder="예: 사무실 PC, 대표님 핫스팟, 자택 공유기 등"
                      className="w-full text-xs md:text-sm px-3.5 py-2.5 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#0A1E3F]/40 font-semibold"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    id="btn-add-ip-submit"
                    className="bg-[#0A1E3F] hover:bg-slate-900 text-[#D4AF37] py-2.5 px-6 rounded-xl text-xs md:text-sm font-bold flex items-center justify-center gap-1 cursor-pointer border border-[#D4AF37]/40 shadow-sm"
                  >
                    <Plus className="h-4 w-4" />
                    <span>허용 주소 등록</span>
                  </button>
                </div>
              </form>
              <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                * 유동 IP 공유기는 전원이 재부팅될 때 접속 IP가 바뀝니다. 해당 경우, 로그인은 유효하지만 본인 IP 재인증 화면으로 진입하게 되므로 “현재 IP 허용하기” 혹은 “비상 로그인 코드”를 통해 언제든 안전하게 자기 자신을 복구할 수 있습니다.
              </p>
            </div>
          )}

          {/* TAB 3: Security Login Logs Viewer */}
          {activeTab === 'logs' && (
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4 animate-in fade-in duration-150" id="section-access-logs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h4 className="text-sm md:text-base font-extrabold text-[#0A1E3F] flex items-center gap-1.5">
                    <Lock className="h-4.5 w-4.5 text-[#C5A028]" />
                    <span>최근 관리 접속 및 보안 인증 로그</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">외부의 공격 또는 관리자의 로그인 시간, IP, 단말기, 성공유무 등의 침입 탐지 로그를 기록합니다.</p>
                </div>
                <button
                  type="button"
                  onClick={loadDashboardData}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-all flex items-center gap-1"
                  title="보안 로그 새로고침"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span className="text-xs font-semibold">새로고침</span>
                </button>
              </div>

              {/* Logs Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-150">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 font-extrabold border-b border-slate-150">
                    <tr>
                      <th className="p-3">승인 일시 (KST)</th>
                      <th className="p-3">IP 주소</th>
                      <th className="p-3">결과</th>
                      <th className="p-3">동작구분</th>
                      <th className="p-3">기기/브라우저</th>
                      <th className="p-3">상세 사유</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600 font-semibold">
                    {accessLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-400">
                          저장된 접속 보안 기록이 존재하지 않습니다.
                        </td>
                      </tr>
                    ) : (
                      accessLogs.map((log, index) => (
                        <tr key={index} className="hover:bg-slate-50/40">
                          <td className="p-3 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                            {log.timestamp}
                          </td>
                          <td className="p-3 font-mono font-bold text-slate-700 whitespace-nowrap">
                            {log.ip}
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            {log.success ? (
                              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 px-2 py-0.5 rounded">
                                성공
                              </span>
                            ) : (
                              <span className="text-[10px] bg-red-50 text-red-700 font-bold border border-red-200 px-2 py-0.5 rounded animate-pulse">
                                실패/차단
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-bold text-slate-800 text-xs whitespace-nowrap">
                            {log.action}
                          </td>
                          <td className="p-3 text-slate-500 max-w-[160px] truncate" title={log.browser}>
                            {log.deviceType} ({log.browser})
                          </td>
                          <td className="p-3 text-slate-700 text-xs font-bold">
                            {log.details}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Modern auto-dismissing toast notifications for iframe-safe user feedback */}
      {notification && (
        <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-2xl border transition-all transform animate-in slide-in-from-bottom-5 duration-300 ${
          notification.type === 'success' 
            ? 'bg-emerald-500 text-white border-emerald-400' 
            : notification.type === 'error'
            ? 'bg-rose-500 text-white border-rose-400'
            : 'bg-slate-800 text-white border-slate-700'
        }`}>
          {notification.type === 'success' ? (
            <ShieldCheck className="h-5 w-5 shrink-0" />
          ) : notification.type === 'error' ? (
            <AlertCircle className="h-5 w-5 shrink-0" />
          ) : (
            <Info className="h-5 w-5 shrink-0" />
          )}
          <span className="text-xs md:text-sm font-bold">{notification.message}</span>
          <button 
            type="button" 
            onClick={() => setNotification(null)}
            className="ml-2 hover:opacity-80 font-bold p-1 rounded transition-opacity cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
