'use client';
import { useEffect, useState } from 'react';
import AdminLayout from '../AdminLayout';
import { toast } from 'sonner';
import { Search, Edit2, X } from 'lucide-react';

interface User {
  id: string; username: string; email: string; usdtBalance: number;
  role: string; isActive: boolean; createdAt: number; lastLoginAt: number | null;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<User | null>(null);
  const [editBalance, setEditBalance] = useState('');
  const [editRole, setEditRole] = useState('user');
  const [editActive, setEditActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchUsers = () => {
    setLoading(true);
    fetch('/api/admin/users').then(r => r.json()).then(d => { setUsers(d.data||[]); setLoading(false); });
  };
  useEffect(() => { fetchUsers(); }, []);

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = (u: User) => { setEditing(u); setEditBalance(u.usdtBalance.toString()); setEditRole(u.role); setEditActive(u.isActive); };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users?id=${editing.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usdtBalance: parseFloat(editBalance), role: editRole, isActive: editActive }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success('User updated!');
      setEditing(null);
      fetchUsers();
    } catch { toast.error('Update failed'); }
    finally { setSaving(false); }
  };

  return (
    <AdminLayout>
      {editing && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth:440 }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20 }}>
              <h3 style={{ fontSize:18,fontWeight:700 }}>Edit User: @{editing.username}</h3>
              <button onClick={() => setEditing(null)} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)' }}><X size={20}/></button>
            </div>
            <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
              <div>
                <label className="input-label">USDT Balance</label>
                <input className="input" type="number" min="0" value={editBalance} onChange={e=>setEditBalance(e.target.value)} />
              </div>
              <div>
                <label className="input-label">Role</label>
                <div className="tab-bar">
                  <button className={`tab ${editRole==='user'?'active':''}`} onClick={() => setEditRole('user')}>User</button>
                  <button className={`tab ${editRole==='admin'?'active':''}`} onClick={() => setEditRole('admin')}>Admin</button>
                </div>
              </div>
              <div>
                <label className="input-label">Account Status</label>
                <div className="tab-bar">
                  <button className={`tab ${editActive?'active':''}`} onClick={() => setEditActive(true)}>Active</button>
                  <button className={`tab ${!editActive?'active':''}`} onClick={() => setEditActive(false)}>Banned</button>
                </div>
              </div>
              <div style={{ display:'flex',gap:10,paddingTop:4 }}>
                <button className="btn btn-outline" style={{ flex:1 }} onClick={() => setEditing(null)}>Cancel</button>
                <button className="btn btn-primary" style={{ flex:1 }} onClick={saveEdit} disabled={saving}>
                  {saving ? <span className="spinner"/> : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding:28 }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20 }}>
          <h1 style={{ fontSize:24,fontWeight:800 }}>User Management</h1>
          <div style={{ position:'relative' }}>
            <Search size={14} style={{ position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'var(--text-muted)' }}/>
            <input className="input" style={{ paddingLeft:32,width:240 }} placeholder="Search users..." value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
        </div>
        <div className="card" style={{ padding:0,overflow:'hidden' }}>
          {loading ? <div style={{ padding:60,textAlign:'center',color:'var(--text-muted)' }}>Loading...</div> :
           <table style={{ width:'100%' }}>
             <thead><tr><th>Username</th><th>Email</th><th>Balance</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
             <tbody>
               {filtered.map(u => (
                 <tr key={u.id}>
                   <td style={{ fontWeight:700 }}>@{u.username}</td>
                   <td style={{ color:'var(--text-secondary)',fontSize:13 }}>{u.email}</td>
                   <td style={{ fontWeight:700,color:'var(--accent-blue)' }}>${u.usdtBalance.toFixed(2)}</td>
                   <td><span className={`badge ${u.role==='admin'?'badge-purple':'badge-blue'}`}>{u.role}</span></td>
                   <td><span className={`badge ${u.isActive?'badge-green':'badge-red'}`}>{u.isActive?'Active':'Banned'}</span></td>
                   <td style={{ fontSize:12,color:'var(--text-muted)' }}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}</td>
                   <td><button className="btn btn-outline btn-sm" onClick={() => openEdit(u)}><Edit2 size={12}/>Edit</button></td>
                 </tr>
               ))}
             </tbody>
           </table>
          }
        </div>
      </div>
    </AdminLayout>
  );
}
