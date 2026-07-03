import React, { useState } from "react";
import { 
  Building, 
  Layers, 
  Grid, 
  Users, 
  FolderOpen, 
  Search, 
  Plus, 
  FileText, 
  ExternalLink, 
  Trash2, 
  TrendingUp, 
  Edit,
  Building2,
  FolderPlus,
  HelpCircle
} from "lucide-react";
import { addDocument, deleteDocument } from "../lib/db";

interface MasterDataManagementProps {
  buildings: any[];
  floors: any[];
  units: any[];
  tenants: any[];
  documents: any[];
  selectedTab: string;
  onRefresh: () => void;
}

export default function MasterDataManagement({
  buildings,
  floors,
  units,
  tenants,
  documents,
  selectedTab,
  onRefresh
}: MasterDataManagementProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  // Dynamic form states
  const [bldForm, setBldForm] = useState({ name: "", address: "", totalFloors: 10, totalUnits: 40, description: "" });
  const [flrForm, setFlrForm] = useState({ buildingId: "", floorNumber: "", totalUnits: 4 });
  const [unitForm, setUnitForm] = useState({ buildingId: "", floorId: "", floorNumber: "01", unitNumber: "", areaSqm: 100, rentPerSqm: 180000, status: "empty" as any });
  const [tenForm, setTenForm] = useState({ companyName: "", contactPerson: "", email: "", phone: "", sector: "Teknologi" });
  const [docForm, setDocForm] = useState({ name: "", type: "application/pdf", size: "2.4 MB", googleDriveUrl: "https://drive.google.com/file/d/mock123/view", buildingId: "", tenantId: "" });

  const handleAddBuilding = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDocument("buildings", {
        ...bldForm,
        image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80",
        createdBy: "Admin TPMS",
        createdAt: new Date().toISOString()
      });
      setShowAddForm(false);
      setBldForm({ name: "", address: "", totalFloors: 10, totalUnits: 40, description: "" });
      onRefresh();
      alert("Gedung berhasil didaftarkan!");
    } catch (err: any) {
      alert("Gagal menambahkan: " + err.message);
    }
  };

  const handleAddFloor = async (e: React.FormEvent) => {
    e.preventDefault();
    const bld = buildings.find(b => b.id === flrForm.buildingId);
    try {
      await addDocument("floors", {
        ...flrForm,
        buildingName: bld?.name || "TIFA Building",
        createdBy: "Admin TPMS",
        createdAt: new Date().toISOString()
      });
      setShowAddForm(false);
      setFlrForm({ buildingId: "", floorNumber: "", totalUnits: 4 });
      onRefresh();
      alert("Lantai berhasil ditambahkan!");
    } catch (err: any) {
      alert("Gagal menambahkan: " + err.message);
    }
  };

  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    const bld = buildings.find(b => b.id === unitForm.buildingId);
    try {
      await addDocument("units", {
        ...unitForm,
        buildingName: bld?.name || "TIFA Building",
        createdBy: "Admin TPMS",
        createdAt: new Date().toISOString()
      });
      setShowAddForm(false);
      setUnitForm({ buildingId: "", floorId: "", floorNumber: "01", unitNumber: "", areaSqm: 100, rentPerSqm: 180000, status: "empty" });
      onRefresh();
      alert("Unit berhasil didaftarkan!");
    } catch (err: any) {
      alert("Gagal menambahkan: " + err.message);
    }
  };

  const handleAddTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDocument("tenants", {
        ...tenForm,
        createdBy: "Admin TPMS",
        createdAt: new Date().toISOString()
      });
      setShowAddForm(false);
      setTenForm({ companyName: "", contactPerson: "", email: "", phone: "", sector: "Teknologi" });
      onRefresh();
      alert("Tenant berhasil didaftarkan!");
    } catch (err: any) {
      alert("Gagal menambahkan: " + err.message);
    }
  };

  const handleAddDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    const bld = buildings.find(b => b.id === docForm.buildingId);
    const ten = tenants.find(t => t.id === docForm.tenantId);
    try {
      await addDocument("documents", {
        ...docForm,
        buildingName: bld?.name || "TIFA Building",
        tenantName: ten?.companyName || "PT Medidata",
        uploadedAt: new Date().toISOString()
      });
      setShowAddForm(false);
      setDocForm({ name: "", type: "application/pdf", size: "2.4 MB", googleDriveUrl: "https://drive.google.com/file/d/mock123/view", buildingId: "", tenantId: "" });
      onRefresh();
      alert("Dokumen sewa berhasil diunggah ke Google Drive!");
    } catch (err: any) {
      alert("Gagal mengunggah: " + err.message);
    }
  };

  const handleDelete = async (collection: any, id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data ini?")) return;
    try {
      await deleteDocument(collection, id);
      onRefresh();
      alert("Data berhasil dihapus!");
    } catch (err: any) {
      alert("Gagal menghapus: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Action Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row justify-between gap-3 items-center">
        <div className="w-full md:w-80 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari kata kunci..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-lg pl-9 pr-3 py-2 text-xs font-sans outline-hidden"
          />
        </div>

        <button
          id="btn-add-master-data"
          onClick={() => setShowAddForm(true)}
          className="w-full md:w-auto bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-sans text-xs font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-1.5 transition shadow-lg shadow-cyan-500/10"
        >
          <Plus className="w-4 h-4" />
          Tambah Baru
        </button>
      </div>

      {/* Add New Form Drawer Overlay */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md p-6 relative shadow-2xl">
            <h3 className="font-sans font-bold text-sm text-white mb-4 flex items-center gap-1.5">
              Formulir Pendaftaran Baru
            </h3>
            
            {/* Conditional Form Render based on selected Tab */}
            {selectedTab === "buildings" && (
              <form onSubmit={handleAddBuilding} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-sans">Nama Gedung</label>
                  <input type="text" placeholder="Ventura / TIFA Building" required value={bldForm.name} onChange={(e) => setBldForm({...bldForm, name: e.target.value})} className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-md px-3 py-1.5 text-xs font-sans outline-hidden" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-sans">Alamat Lengkap</label>
                  <input type="text" placeholder="Jl. TB Simatupang..." required value={bldForm.address} onChange={(e) => setBldForm({...bldForm, address: e.target.value})} className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-md px-3 py-1.5 text-xs font-sans outline-hidden" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase font-sans">Jumlah Lantai</label>
                    <input type="number" required value={bldForm.totalFloors} onChange={(e) => setBldForm({...bldForm, totalFloors: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-md px-3 py-1.5 text-xs font-sans outline-hidden" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase font-sans">Kapasitas Unit</label>
                    <input type="number" required value={bldForm.totalUnits} onChange={(e) => setBldForm({...bldForm, totalUnits: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-md px-3 py-1.5 text-xs font-sans outline-hidden" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-sans">Deskripsi Ringkas</label>
                  <input type="text" placeholder="Spesifikasi kelas..." value={bldForm.description} onChange={(e) => setBldForm({...bldForm, description: e.target.value})} className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-md px-3 py-1.5 text-xs font-sans outline-hidden" />
                </div>
                <div className="flex justify-end gap-2.5 pt-2">
                  <button type="button" onClick={() => setShowAddForm(false)} className="bg-slate-950 text-slate-400 px-4 py-2 rounded-lg text-xs font-sans">Batal</button>
                  <button type="submit" className="bg-cyan-500 text-slate-950 font-sans text-xs font-bold px-4 py-2 rounded-lg shadow-lg">Simpan</button>
                </div>
              </form>
            )}

            {selectedTab === "floors" && (
              <form onSubmit={handleAddFloor} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-sans">Pilih Gedung</label>
                  <select required value={flrForm.buildingId} onChange={(e) => setFlrForm({...flrForm, buildingId: e.target.value})} className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-md px-3 py-1.5 text-xs font-sans outline-hidden">
                    <option value="">Pilih...</option>
                    {buildings.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-sans">Nomor Lantai</label>
                  <input type="text" placeholder="01 / Penthouse" required value={flrForm.floorNumber} onChange={(e) => setFlrForm({...flrForm, floorNumber: e.target.value})} className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-md px-3 py-1.5 text-xs font-sans outline-hidden" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-sans">Jumlah Unit di Lantai Ini</label>
                  <input type="number" required value={flrForm.totalUnits} onChange={(e) => setFlrForm({...flrForm, totalUnits: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-md px-3 py-1.5 text-xs font-sans outline-hidden" />
                </div>
                <div className="flex justify-end gap-2.5 pt-2">
                  <button type="button" onClick={() => setShowAddForm(false)} className="bg-slate-950 text-slate-400 px-4 py-2 rounded-lg text-xs font-sans">Batal</button>
                  <button type="submit" className="bg-cyan-500 text-slate-950 font-sans text-xs font-bold px-4 py-2 rounded-lg shadow-lg">Simpan</button>
                </div>
              </form>
            )}

            {selectedTab === "units" && (
              <form onSubmit={handleAddUnit} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-sans">Pilih Gedung</label>
                  <select required value={unitForm.buildingId} onChange={(e) => setUnitForm({...unitForm, buildingId: e.target.value})} className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-md px-3 py-1.5 text-xs font-sans outline-hidden">
                    <option value="">Pilih...</option>
                    {buildings.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase font-sans">Lantai</label>
                    <input type="text" placeholder="01" required value={unitForm.floorNumber} onChange={(e) => setUnitForm({...unitForm, floorNumber: e.target.value})} className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-md px-3 py-1.5 text-xs font-sans outline-hidden" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase font-sans">Nomor Unit / Suite</label>
                    <input type="text" placeholder="Suite 101" required value={unitForm.unitNumber} onChange={(e) => setUnitForm({...unitForm, unitNumber: e.target.value})} className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-md px-3 py-1.5 text-xs font-sans outline-hidden" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase font-sans">Luas Unit (m²)</label>
                    <input type="number" required value={unitForm.areaSqm} onChange={(e) => setUnitForm({...unitForm, areaSqm: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-md px-3 py-1.5 text-xs font-sans outline-hidden" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase font-sans">Tarif / m² / Bulan (Rp)</label>
                    <input type="number" required value={unitForm.rentPerSqm} onChange={(e) => setUnitForm({...unitForm, rentPerSqm: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-md px-3 py-1.5 text-xs font-sans outline-hidden" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-sans">Status Ketersediaan</label>
                  <select value={unitForm.status} onChange={(e) => setUnitForm({...unitForm, status: e.target.value as any})} className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-md px-3 py-1.5 text-xs font-sans outline-hidden">
                    <option value="empty">Kosong (Available)</option>
                    <option value="leased">Disewa (Leased)</option>
                    <option value="maintenance">Pemeliharaan (Maintenance)</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2.5 pt-2">
                  <button type="button" onClick={() => setShowAddForm(false)} className="bg-slate-950 text-slate-400 px-4 py-2 rounded-lg text-xs font-sans">Batal</button>
                  <button type="submit" className="bg-cyan-500 text-slate-950 font-sans text-xs font-bold px-4 py-2 rounded-lg shadow-lg">Simpan</button>
                </div>
              </form>
            )}

            {selectedTab === "tenants" && (
              <form onSubmit={handleAddTenant} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-sans">Nama Perusahaan / Tenant</label>
                  <input type="text" placeholder="PT Telekomunikasi Seluler" required value={tenForm.companyName} onChange={(e) => setTenForm({...tenForm, companyName: e.target.value})} className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-md px-3 py-1.5 text-xs font-sans outline-hidden" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-sans">Penanggung Jawab (Contact Person)</label>
                  <input type="text" placeholder="Budi Santoso" required value={tenForm.contactPerson} onChange={(e) => setTenForm({...tenForm, contactPerson: e.target.value})} className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-md px-3 py-1.5 text-xs font-sans outline-hidden" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase font-sans">Email Resmi</label>
                    <input type="email" placeholder="corsec@tenant.co.id" required value={tenForm.email} onChange={(e) => setTenForm({...tenForm, email: e.target.value})} className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-md px-3 py-1.5 text-xs font-sans outline-hidden" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase font-sans">Telepon / Fax</label>
                    <input type="text" placeholder="021-..." required value={tenForm.phone} onChange={(e) => setTenForm({...tenForm, phone: e.target.value})} className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-md px-3 py-1.5 text-xs font-sans outline-hidden" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-sans">Sektor Industri</label>
                  <input type="text" placeholder="Teknologi / F&B / Logistik" required value={tenForm.sector} onChange={(e) => setTenForm({...tenForm, sector: e.target.value})} className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-md px-3 py-1.5 text-xs font-sans outline-hidden" />
                </div>
                <div className="flex justify-end gap-2.5 pt-2">
                  <button type="button" onClick={() => setShowAddForm(false)} className="bg-slate-950 text-slate-400 px-4 py-2 rounded-lg text-xs font-sans">Batal</button>
                  <button type="submit" className="bg-cyan-500 text-slate-950 font-sans text-xs font-bold px-4 py-2 rounded-lg shadow-lg">Simpan</button>
                </div>
              </form>
            )}

            {selectedTab === "documents" && (
              <form onSubmit={handleAddDoc} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-sans">Nama File Kontrak</label>
                  <input type="text" placeholder="Sewa_Astra_Amandemen.pdf" required value={docForm.name} onChange={(e) => setDocForm({...docForm, name: e.target.value})} className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-md px-3 py-1.5 text-xs font-sans outline-hidden" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-sans">Tautkan ke Gedung</label>
                  <select required value={docForm.buildingId} onChange={(e) => setDocForm({...docForm, buildingId: e.target.value})} className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-md px-3 py-1.5 text-xs font-sans outline-hidden">
                    <option value="">Pilih...</option>
                    {buildings.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-sans">Tautkan ke Tenant</label>
                  <select required value={docForm.tenantId} onChange={(e) => setDocForm({...docForm, tenantId: e.target.value})} className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-md px-3 py-1.5 text-xs font-sans outline-hidden">
                    <option value="">Pilih...</option>
                    {tenants.map(t => (
                      <option key={t.id} value={t.id}>{t.companyName}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-sans">Tautan Google Drive (Simulated)</label>
                  <input type="text" required value={docForm.googleDriveUrl} onChange={(e) => setDocForm({...docForm, googleDriveUrl: e.target.value})} className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-md px-3 py-1.5 text-xs font-sans outline-hidden" />
                </div>
                <div className="flex justify-end gap-2.5 pt-2">
                  <button type="button" onClick={() => setShowAddForm(false)} className="bg-slate-950 text-slate-400 px-4 py-2 rounded-lg text-xs font-sans">Batal</button>
                  <button type="submit" className="bg-cyan-500 text-slate-950 font-sans text-xs font-bold px-4 py-2 rounded-lg shadow-lg">Unggah Kontrak</button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* Render Main Selected Master Module */}
      {selectedTab === "buildings" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {buildings.filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase())).map((b) => (
            <div key={b.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between shadow-md">
              <img src={b.image} alt={b.name} className="w-full h-44 object-cover border-b border-slate-800" />
              <div className="p-5 flex-1 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-sans font-bold text-base text-white">{b.name}</h3>
                    <p className="font-sans text-[11px] text-slate-400 mt-0.5">{b.address}</p>
                  </div>
                  <button
                    id={`btn-delete-bld-${b.id}`}
                    onClick={() => handleDelete("buildings", b.id)}
                    className="text-slate-500 hover:text-rose-400 p-1.5 rounded hover:bg-slate-800/80 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="font-sans text-xs text-slate-400 leading-relaxed">{b.description}</p>
                
                <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3 rounded-lg text-xs font-sans border border-slate-850/50">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Total Lantai:</span>
                    <span className="font-bold text-white">{b.totalFloors} Lantai</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Kapasitas Unit:</span>
                    <span className="font-bold text-white">{b.totalUnits} Suite Office</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedTab === "floors" && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 font-sans text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Nama Gedung</th>
                  <th className="py-3.5 px-4">Lantai</th>
                  <th className="py-3.5 px-4">Kapasitas Unit</th>
                  <th className="py-3.5 px-4">Dibuat Oleh</th>
                  <th className="py-3.5 px-4">Tanggal Pendaftaran</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans text-xs text-slate-300">
                {floors.filter(f => f.buildingName.toLowerCase().includes(searchQuery.toLowerCase())).map((f) => (
                  <tr key={f.id} className="hover:bg-slate-950/30 transition">
                    <td className="py-3 px-4 font-semibold text-white">{f.buildingName}</td>
                    <td className="py-3 px-4 font-mono font-bold text-cyan-400">Lantai {f.floorNumber}</td>
                    <td className="py-3 px-4">{f.totalUnits} Unit Perkantoran</td>
                    <td className="py-3 px-4 text-slate-400">{f.createdBy}</td>
                    <td className="py-3 px-4 text-slate-500">{new Date(f.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        id={`btn-delete-flr-${f.id}`}
                        onClick={() => handleDelete("floors", f.id)}
                        className="text-slate-500 hover:text-rose-400 p-1.5 rounded transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedTab === "units" && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 font-sans text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Gedung</th>
                  <th className="py-3.5 px-4">Lantai</th>
                  <th className="py-3.5 px-4">Nomor Unit</th>
                  <th className="py-3.5 px-4">Luas (m²)</th>
                  <th className="py-3.5 px-4">Harga Sewa / m²</th>
                  <th className="py-3.5 px-4">Estimasi Harga Bulanan</th>
                  <th className="py-3.5 px-4">Status Ketersediaan</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans text-xs text-slate-300">
                {units.filter(u => u.buildingName.toLowerCase().includes(searchQuery.toLowerCase()) || u.unitNumber.toLowerCase().includes(searchQuery.toLowerCase())).map((u) => (
                  <tr key={u.id} className="hover:bg-slate-950/30 transition">
                    <td className="py-3 px-4 font-semibold text-white">{u.buildingName}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">Lantai {u.floorNumber}</td>
                    <td className="py-3 px-4 font-bold text-slate-100">{u.unitNumber}</td>
                    <td className="py-3 px-4 font-mono">{u.areaSqm} m²</td>
                    <td className="py-3 px-4 font-mono text-slate-400">Rp {u.rentPerSqm?.toLocaleString("id-ID")}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-cyan-400">
                      Rp {(u.areaSqm * u.rentPerSqm)?.toLocaleString("id-ID")}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.status === "empty" ? "bg-emerald-950 text-emerald-400 border border-emerald-800" :
                        u.status === "leased" ? "bg-cyan-950 text-cyan-400 border border-cyan-800" :
                        "bg-amber-950 text-amber-400 border border-amber-850"
                      }`}>
                        {u.status === "empty" ? "Kosong (Available)" : u.status === "leased" ? "Disewa (Leased)" : "Maintenance"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        id={`btn-delete-unit-${u.id}`}
                        onClick={() => handleDelete("units", u.id)}
                        className="text-slate-500 hover:text-rose-400 p-1.5 rounded transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedTab === "tenants" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tenants.filter(t => t.companyName.toLowerCase().includes(searchQuery.toLowerCase())).map((t) => (
            <div key={t.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-md space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-950 text-slate-400 border border-slate-800 font-sans uppercase">
                    {t.sector}
                  </span>
                  <button
                    id={`btn-delete-ten-${t.id}`}
                    onClick={() => handleDelete("tenants", t.id)}
                    className="text-slate-500 hover:text-rose-400 p-1 rounded transition hover:bg-slate-800"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <h3 className="font-sans font-bold text-sm text-white">{t.companyName}</h3>
                <p className="font-sans text-xs text-slate-400">PJ: <strong className="text-slate-300">{t.contactPerson}</strong></p>
              </div>

              <div className="border-t border-slate-800 pt-3 space-y-1.5 font-sans text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Email:</span>
                  <span className="text-slate-200 font-semibold truncate max-w-[180px]">{t.email}</span>
                </div>
                <div className="flex justify-between">
                  <span>Telepon:</span>
                  <span className="text-slate-200 font-semibold">{t.phone}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedTab === "documents" && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md">
          {/* Header warning */}
          <div className="bg-slate-950/60 p-4 border-b border-slate-800 flex gap-2 text-cyan-400">
            <FolderOpen className="w-5 h-5 text-cyan-400 shrink-0" />
            <p className="font-sans text-xs text-slate-400">
              <strong className="text-cyan-400">Google Drive Cloud Storage:</strong> Seluruh draf kontrak di bawah ini secara otomatis disimpan dalam folder korporat Google Drive terstruktur (Ventura, TIFA, Alamanda, GBS). Mengeklik ikon tautan akan mengarahkan Anda ke draf PDF di Google Cloud Storage.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 font-sans text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Nama Dokumen Sewa</th>
                  <th className="py-3.5 px-4">Gedung Terkait</th>
                  <th className="py-3.5 px-4">Tenant Penyewa</th>
                  <th className="py-3.5 px-4">Ukuran</th>
                  <th className="py-3.5 px-4">Tanggal Diunggah</th>
                  <th className="py-3.5 px-4 text-right">Folder Google Drive</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans text-xs text-slate-300">
                {documents.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()) || (d.tenantName || "").toLowerCase().includes(searchQuery.toLowerCase())).map((d) => (
                  <tr key={d.id} className="hover:bg-slate-950/30 transition">
                    <td className="py-3 px-4 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span className="font-semibold text-white">{d.name}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">{d.buildingName || "N/A"}</td>
                    <td className="py-3 px-4 font-medium text-slate-200">{d.tenantName || "N/A"}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{d.size}</td>
                    <td className="py-3 px-4 text-slate-500">{new Date(d.uploadedAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <a
                          href={d.googleDriveUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-slate-950 text-cyan-400 hover:text-white border border-slate-800 hover:border-cyan-600 px-2.5 py-1 rounded-md text-[10px] font-bold inline-flex items-center gap-1 transition"
                        >
                          Google Drive ↗
                        </a>
                        <button
                          id={`btn-delete-doc-${d.id}`}
                          onClick={() => handleDelete("documents", d.id)}
                          className="text-slate-500 hover:text-rose-400 p-1.5 rounded transition hover:bg-slate-800"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
