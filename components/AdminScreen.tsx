
import React, { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { collection, doc, limit, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { UserData } from '../types';
import { getAdminEmail, getFirebaseAuth, getFirestoreDb } from '../utils/firebase';
import AdminLoginScreen from './AdminLoginScreen';

interface AdminScreenProps {
  userData: UserData;
}

const AdminScreen: React.FC<AdminScreenProps> = ({ userData }) => {
  const firebaseAuth = useMemo(() => getFirebaseAuth(), []);
  const firestoreDb = useMemo(() => getFirestoreDb(), []);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [presaleSubmissions, setPresaleSubmissions] = useState<any[]>([]);
  const [presaleError, setPresaleError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, (u) => {
      setAuthUser(u);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  const isAllowed = useMemo(() => {
    if (!authUser?.email) return false;
    const adminEmail = getAdminEmail();
    if (!adminEmail) return false;
    return authUser.email.toLowerCase() === adminEmail.toLowerCase();
  }, [authUser?.email]);

  useEffect(() => {
    if (!authReady || !isAllowed) {
      setPresaleSubmissions([]);
      return;
    }
    const q = query(collection(firestoreDb, 'presale_submissions'), orderBy('createdAt', 'desc'), limit(50));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setPresaleError(null);
        const rows = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any)
        }));
        setPresaleSubmissions(rows.filter((r) => (r.status || 'PENDING') === 'PENDING'));
      },
      (err) => {
        setPresaleSubmissions([]);
        setPresaleError(err?.message || 'PRESALE_SUBSCRIBE_FAILED');
      }
    );
    return () => unsub();
  }, [authReady, isAllowed, firestoreDb]);

  const updatePresaleStatus = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    setPresaleError(null);
    try {
      await updateDoc(doc(firestoreDb, 'presale_submissions', id), {
        status,
        reviewedAt: new Date().toISOString(),
        reviewer: authUser?.email || null,
        updatedAt: new Date().toISOString()
      });

      if (status === 'APPROVED') {
        setToast('APPROVED: Presale submission updated.');
        window.setTimeout(() => setToast(null), 2000);
      }
    } catch (e: any) {
      setPresaleError(e?.message || 'PRESALE_UPDATE_FAILED');
    }
  };

  const handleLogout = async () => {
    await signOut(firebaseAuth);
  };

  const formatAmount = (value: any) => {
    const n = typeof value === 'number' ? value : parseFloat(value);
    return Number.isFinite(n) ? n.toFixed(3) : '0.000';
  };

  if (!authReady) {
    return (
      <div className="flex-1 flex flex-col bg-[#0a0f1f] text-blue-400 font-mono p-6 space-y-6 overflow-y-auto">
        <div className="border-b border-blue-900 pb-2">
          <h2 className="text-2xl font-black uppercase tracking-tighter">CENTRAL_COMMAND_V99</h2>
          <p className="text-[10px] opacity-50 uppercase">SYNCING_AUTH...</p>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return <AdminLoginScreen onLoggedIn={() => {}} />;
  }

  if (!isAllowed) {
    return (
      <div className="flex-1 flex flex-col bg-[#0a0f1f] text-blue-400 font-mono p-6 space-y-6 overflow-y-auto">
        <div className="border-b border-blue-900 pb-2">
          <h2 className="text-2xl font-black uppercase tracking-tighter">ACCESS_DENIED</h2>
          <p className="text-[10px] opacity-50 uppercase">This account is not authorized for admin.</p>
        </div>
        <div className="bg-[#0b1224] border border-blue-900 p-4 space-y-2">
          <p className="text-[10px] font-black uppercase">SIGNED_IN_AS</p>
          <p className="text-[12px] text-white font-bold break-words">{authUser.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="bg-blue-600 text-white py-3 font-black text-xs hover:bg-blue-400"
        >
          LOGOUT
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#0a0f1f] text-blue-400 font-mono p-6 space-y-6 overflow-y-auto">
      <div className="border-b border-blue-900 pb-2 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tighter">PRESALE_COMMAND</h2>
          <p className="text-[10px] opacity-50 uppercase">Presale Audit Queue</p>
        </div>
        <button
          onClick={handleLogout}
          className="bg-[#c0c0c0] text-black px-4 py-2 font-black text-[10px] uppercase hover:bg-white"
        >
          LOGOUT
        </button>
      </div>

      {presaleError && (
        <div className="bg-[#0b1224] border border-blue-900 p-3 text-[10px] uppercase break-words text-blue-300">
          {presaleError}
        </div>
      )}

      {toast && (
        <div className="bg-[#0b1224] border border-blue-900 p-3 text-[10px] uppercase break-words text-blue-200">
          {toast}
        </div>
      )}

      <div className="bg-[#0b1224] border border-blue-900 p-4 space-y-3">
        <div className="flex justify-between items-center">
          <p className="text-xs font-black uppercase">PRESALE_QUEUE</p>
          <p className="text-xs font-black text-white">{presaleSubmissions.length}</p>
        </div>
        <div className="space-y-2">
          {presaleSubmissions.map((p) => (
            <div key={p.id} className="border border-blue-900/40 p-3 bg-[#0a0f1f]">
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-[10px] font-black uppercase text-blue-300">{p.status || 'PENDING'}</p>
                  <p className="text-[12px] font-black text-white truncate">{p.handle || 'unknown'}</p>
                  <p className="text-[9px] opacity-70 truncate">{p.wallet || ''}</p>
                  <p className="text-[11px] font-black text-blue-200">{formatAmount(p.amount)} SOL</p>
                  <p className="text-[8px] opacity-50 font-mono truncate">{p.proofUrl || ''}</p>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button
                    onClick={() => updatePresaleStatus(p.id, 'APPROVED')}
                    disabled={p.status === 'APPROVED'}
                    className="bg-blue-600 text-white px-4 py-2 font-black text-[10px] uppercase disabled:opacity-40"
                  >
                    APPROVE
                  </button>
                  <button
                    onClick={() => updatePresaleStatus(p.id, 'REJECTED')}
                    disabled={p.status === 'REJECTED'}
                    className="bg-slate-700 text-white px-4 py-2 font-black text-[10px] uppercase disabled:opacity-40"
                  >
                    REJECT
                  </button>
                </div>
              </div>
            </div>
          ))}
          {presaleSubmissions.length === 0 && (
            <div className="text-center py-10 opacity-30 italic font-black uppercase text-[10px] tracking-[0.3em]">_EMPTY_PRESALE_QUEUE_</div>
          )}
        </div>
      </div>

      <div className="flex-1 bg-[#0b1224] border border-blue-900 p-4 overflow-hidden">
        <p className="text-[10px] font-black uppercase mb-2">Live_Activity_Feed</p>
        <div className="text-[9px] opacity-50 space-y-1">
          <p>{'>'} User {userData.handle || 'Guest'} logged {userData.airdropPoints} pts</p>
          <p>{'>'} Syncing with RPC: mainnet-beta</p>
          <p>{'>'} Filtering bots: 1,402 detected</p>
          <p>{'>'} Snapshot pending in 48h</p>
        </div>
      </div>
    </div>
  );
};

export default AdminScreen;
