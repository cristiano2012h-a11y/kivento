import React, { useEffect, useState } from 'react';
import { Bell, Check, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { TRANSLATIONS } from '../data/mockData';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  timestamp: string;
  read: boolean;
}

interface NotificationCenterProps {
  language: 'pt' | 'en' | 'es' | 'fr';
  refreshTrigger: number; // Increment to force immediate reload
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ language, refreshTrigger }) => {
  const t = TRANSLATIONS[language];
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [toast, setToast] = useState<Notification | null>(null);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        
        // If we get a NEW unread notification, trigger a toast popup
        if (data.length > 0) {
          const latest = data[0];
          // Simple check: if latest is unread and different from what we had, show toast
          if (!latest.read && (notifications.length === 0 || latest.id !== notifications[0]?.id)) {
            setToast(latest);
            setTimeout(() => setToast(null), 6000);
          }
        }
        setNotifications(data);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 4 seconds to get rapid updates on order shipping/payment simulation
    const interval = setInterval(fetchNotifications, 4000);
    return () => clearInterval(interval);
  }, [refreshTrigger]);

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/read-all', { method: 'POST' });
      if (response.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error('Failed to mark notifications as read:', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative" id="notification-center">
      {/* Toast Notification Popup */}
      {toast && (
        <div 
          className="fixed bottom-6 right-6 z-50 flex items-start gap-3 bg-white border-l-4 border-l-blue-600 border border-slate-200 p-4 rounded-xl shadow-2xl max-w-sm animate-bounce"
          id="notif-toast"
        >
          <div className="mt-0.5" id="toast-icon">
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
            {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-blue-600" />}
          </div>
          <div className="flex-1" id="toast-content">
            <h4 className="text-sm font-semibold text-slate-800">{toast.title}</h4>
            <p className="text-xs text-slate-600 mt-1">{toast.message}</p>
          </div>
          <button 
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-slate-600 text-xs font-medium cursor-pointer"
            id="toast-close-btn"
          >
            ✕
          </button>
        </div>
      )}

      {/* Bell Icon Trigger */}
      <button
        id="notif-bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-blue-600 transition-all cursor-pointer shadow-sm"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span 
            className="absolute top-0 right-0 w-5 h-5 bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center rounded-full border-2 border-white shadow-sm animate-pulse"
            id="notif-badge"
          >
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
            id="notif-overlay"
          />
          <div 
            className="absolute right-0 mt-3 w-80 md:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2"
            id="notif-dropdown"
          >
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100" id="notif-header">
              <span className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-600" />
                {t.notifications}
              </span>
              {unreadCount > 0 && (
                <button
                  id="mark-all-read-btn"
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer transition-colors font-semibold"
                >
                  <Check className="w-3.5 h-3.5" />
                  {t.read_all}
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100" id="notif-list">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs" id="empty-notif">
                  Sem notificações recentes.
                </div>
              ) : (
                notifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    className={`p-3.5 flex items-start gap-3 transition-colors ${notif.read ? 'bg-white' : 'bg-blue-50/30 border-l-2 border-l-blue-600'}`}
                    id={`notif-item-${notif.id}`}
                  >
                    <div className="mt-0.5" id={`notif-item-icon-${notif.id}`}>
                      {notif.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      {notif.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                      {notif.type === 'info' && <Info className="w-4 h-4 text-blue-600" />}
                    </div>
                    <div className="flex-1" id={`notif-item-body-${notif.id}`}>
                      <h5 className="text-xs font-semibold text-slate-800">{notif.title}</h5>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{notif.message}</p>
                      <span className="text-[9px] text-slate-400 mt-1 block">
                        {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
