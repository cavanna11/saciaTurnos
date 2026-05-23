import { useState } from 'react';
import { useBusiness } from '../../contexts/BusinessContext';
import { formatPrice, formatDate } from '../../utils/dateUtils';

// --- Professional SVG Icons ---
const BusinessIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
);

const ActiveIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
);

const SuspendedIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
);

const RevenueIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
);

const DebtIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
);

export default function SuperAdminDashboard() {
  const { state, dispatch } = useBusiness();
  const { businesses, whatsappConfig, whatsappLogs, appointments, professionals, services } = state;

  const [activeTab, setActiveTab] = useState('resumen');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [modalType, setModalType] = useState(null); // 'payment' | 'debt' | 'upgrade'
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [debtAmount, setDebtAmount] = useState('');

  // Upgrade Plan fields
  const [selectedPlan, setSelectedPlan] = useState('basico');
  const [upgradeQuota, setUpgradeQuota] = useState('');
  const [upgradeFee, setUpgradeFee] = useState('');

  // WhatsApp Form
  const [waForm, setWaForm] = useState({
    phoneId: whatsappConfig?.phoneId || '',
    token: whatsappConfig?.token || '',
    templateConfirmation: whatsappConfig?.templateConfirmation || '',
    templateReminder: whatsappConfig?.templateReminder || '',
  });
  const [waSaved, setWaSaved] = useState(false);

  // Filters
  const [tenantStatusFilter, setTenantStatusFilter] = useState('all');
  const [tenantDebtFilter, setTenantDebtFilter] = useState('all');

  const [appointmentBusinessFilter, setAppointmentBusinessFilter] = useState('all');
  const [appointmentDateFilter, setAppointmentDateFilter] = useState('');

  const [logBusinessFilter, setLogBusinessFilter] = useState('all');
  const [logStatusFilter, setLogStatusFilter] = useState('all');
  const [logDateFilter, setLogDateFilter] = useState('');

  // --- Calculations ---
  const totalBusinesses = businesses?.length || 0;
  const activeCount = businesses?.filter(b => !b.isFrozen).length || 0;
  const suspendedCount = businesses?.filter(b => b.isFrozen).length || 0;
  const projectedRevenue = businesses?.reduce((sum, b) => sum + (b.monthlyFee || 0), 0) || 0;
  const totalDebt = businesses?.reduce((sum, b) => sum + (b.debt || 0), 0) || 0;

  // Monthly WhatsApp message counting helper
  const getCurrentMonthStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };
  const currentMonthStr = getCurrentMonthStr();

  const getMonthlyMessageCount = (businessId) => {
    return whatsappLogs?.filter(log => 
      log.businessId === businessId && 
      log.status === 'sent' && 
      log.sentAt && 
      log.sentAt.startsWith(currentMonthStr)
    ).length || 0;
  };
  
  // WhatsApp stats
  const totalMsgs = whatsappLogs?.length || 0;
  const failedMsgs = whatsappLogs?.filter(l => l.status === 'failed').length || 0;
  const successMsgs = totalMsgs - failedMsgs;
  const failedPercentage = totalMsgs > 0 ? ((failedMsgs / totalMsgs) * 100).toFixed(1) : '0.0';

  // --- Handlers ---
  const handleToggleFreeze = (id) => {
    dispatch({ type: 'TOGGLE_FREEZE_BUSINESS', payload: id });
  };

  const handleOpenPaymentModal = (biz) => {
    setSelectedBusiness(biz);
    setPaymentAmount(biz.debt.toString());
    setModalType('payment');
  };

  const handleOpenDebtModal = (biz) => {
    setSelectedBusiness(biz);
    setDebtAmount(biz.debt.toString());
    setModalType('debt');
  };

  const handleOpenUpgradeModal = (biz) => {
    setSelectedBusiness(biz);
    if (biz.whatsappQuota === 100) {
      setSelectedPlan('basico');
    } else if (biz.whatsappQuota === 500) {
      setSelectedPlan('pro');
    } else if (biz.whatsappQuota === 2000) {
      setSelectedPlan('business');
    } else {
      setSelectedPlan('personalizado');
      setUpgradeQuota(biz.whatsappQuota.toString());
      setUpgradeFee(biz.monthlyFee.toString());
    }
    setModalType('upgrade');
  };

  const handleRecordPayment = () => {
    if (!paymentAmount || isNaN(paymentAmount)) return;
    const todayStr = new Date().toISOString().split('T')[0];
    dispatch({
      type: 'RECORD_BUSINESS_PAYMENT',
      payload: { 
        businessId: selectedBusiness.id, 
        amount: Number(paymentAmount),
        date: todayStr
      }
    });
    dispatch({
      type: 'ADD_WHATSAPP_LOG',
      payload: {
        id: 'wlog-' + Date.now(),
        businessId: selectedBusiness.id,
        businessName: selectedBusiness.name,
        recipient: selectedBusiness.phone,
        recipientName: selectedBusiness.name,
        type: 'Pago Registrado',
        status: 'sent',
        sentAt: new Date().toISOString(),
        message: `Hola ${selectedBusiness.name}, se ha registrado un pago de abono por un monto de ${formatPrice(Number(paymentAmount))}. ¡Gracias por confiar en SaciaTurno!`
      }
    });
    setModalType(null);
    setSelectedBusiness(null);
  };

  const handleEditDebt = () => {
    if (debtAmount === '' || isNaN(debtAmount)) return;
    dispatch({
      type: 'UPDATE_BUSINESS_DEBT',
      payload: { businessId: selectedBusiness.id, debt: Number(debtAmount) }
    });
    setModalType(null);
    setSelectedBusiness(null);
  };

  const handleRecordUpgrade = () => {
    let quota = 100;
    let fee = 12000;
    let planLabel = 'Plan Básico';

    if (selectedPlan === 'basico') {
      quota = 100;
      fee = 12000;
      planLabel = 'Plan Básico';
    } else if (selectedPlan === 'pro') {
      quota = 500;
      fee = 22000;
      planLabel = 'Plan Pro';
    } else if (selectedPlan === 'business') {
      quota = 2000;
      fee = 35000;
      planLabel = 'Plan Business';
    } else if (selectedPlan === 'personalizado') {
      quota = Number(upgradeQuota) || 0;
      fee = Number(upgradeFee) || 0;
      planLabel = 'Plan Personalizado';
    }

    dispatch({
      type: 'UPGRADE_BUSINESS_PLAN',
      payload: {
        businessId: selectedBusiness.id,
        whatsappQuota: quota,
        monthlyFee: fee,
      }
    });

    dispatch({
      type: 'ADD_WHATSAPP_LOG',
      payload: {
        id: 'wlog-' + Date.now(),
        businessId: selectedBusiness.id,
        businessName: selectedBusiness.name,
        recipient: selectedBusiness.phone || '+54 11 9999-9999',
        recipientName: selectedBusiness.name,
        type: 'Plan Actualizado',
        status: 'sent',
        sentAt: new Date().toISOString(),
        message: `Hola ${selectedBusiness.name}, tu plan ha sido actualizado a ${planLabel}. Nueva cuota: ${quota} mensajes/mes, abono mensual: ${formatPrice(fee)}.`
      }
    });

    setModalType(null);
    setSelectedBusiness(null);
  };

  const handleSaveWhatsApp = (e) => {
    e.preventDefault();
    dispatch({ type: 'UPDATE_GLOBAL_WHATSAPP', payload: waForm });
    setWaSaved(true);
    setTimeout(() => setWaSaved(false), 3000);
  };

  const filteredBusinesses = businesses?.filter(b => {
    const matchesSearch = b.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          b.slug.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStatus = true;
    if (tenantStatusFilter === 'active') matchesStatus = !b.isFrozen;
    if (tenantStatusFilter === 'frozen') matchesStatus = b.isFrozen;

    let matchesDebt = true;
    if (tenantDebtFilter === 'debt') matchesDebt = (b.debt || 0) > 0;
    if (tenantDebtFilter === 'no_debt') matchesDebt = (b.debt || 0) === 0;

    return matchesSearch && matchesStatus && matchesDebt;
  }) || [];

  const filteredAppointments = [...(appointments || [])]
    .filter(apt => {
      const matchesBusiness = appointmentBusinessFilter === 'all' || apt.businessId === appointmentBusinessFilter;
      const matchesDate = !appointmentDateFilter || apt.appointmentDate === appointmentDateFilter;
      return matchesBusiness && matchesDate;
    })
    .sort((a, b) => {
      const da = a.appointmentDate + 'T' + a.startTime;
      const db = b.appointmentDate + 'T' + b.startTime;
      return db.localeCompare(da);
    });

  const filteredLogs = (whatsappLogs || [])
    .filter(log => {
      const matchesBusiness = logBusinessFilter === 'all' || log.businessId === logBusinessFilter;
      const matchesStatus = logStatusFilter === 'all' || log.status === logStatusFilter;
      const matchesDate = !logDateFilter || (log.sentAt && log.sentAt.startsWith(logDateFilter));
      return matchesBusiness && matchesStatus && matchesDate;
    });

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      
      {/* Page Header */}
      <div className="admin-page-header" style={{ marginBottom: 'var(--space-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>Panel Global</span>
          </h1>
          <span className="text-secondary text-sm">Control de establecimientos, facturación y automatización.</span>
        </div>
        <button 
          onClick={() => {
            if (window.confirm('¿Estás seguro de que deseas reiniciar todos los datos a los valores iniciales de prueba? Se perderán las modificaciones locales.')) {
              dispatch({ type: 'RESET_DATA' });
              window.location.reload();
            }
          }}
          className="btn btn-outline"
          style={{ borderColor: '#ef4444', color: '#ef4444', fontSize: 12, padding: '8px 14px' }}
        >
          Reiniciar Base de Datos (Mocks)
        </button>
      </div>

      {/* Tabs Menu */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--border-color)', paddingBottom: 1, marginBottom: 'var(--space-lg)', overflowX: 'auto' }}>
        <button 
          onClick={() => setActiveTab('resumen')}
          className={`btn ${activeTab === 'resumen' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderRadius: '8px 8px 0 0', borderBottom: 'none', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          Resumen Plataforma
        </button>
        <button 
          onClick={() => setActiveTab('tenants')}
          className={`btn ${activeTab === 'tenants' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderRadius: '8px 8px 0 0', borderBottom: 'none', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          Gestionar Barberías ({totalBusinesses})
        </button>
        <button 
          onClick={() => setActiveTab('citas')}
          className={`btn ${activeTab === 'citas' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderRadius: '8px 8px 0 0', borderBottom: 'none', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          Monitoreo de Turnos ({appointments?.length || 0})
        </button>
        <button 
          onClick={() => setActiveTab('whatsapp')}
          className={`btn ${activeTab === 'whatsapp' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderRadius: '8px 8px 0 0', borderBottom: 'none', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          API WhatsApp Cloud
        </button>
        <button 
          onClick={() => setActiveTab('logs')}
          className={`btn ${activeTab === 'logs' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderRadius: '8px 8px 0 0', borderBottom: 'none', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          Historial Mensajes ({totalMsgs})
        </button>
      </div>

      {/* TAB 1: RESUMEN GENERAL */}
      {activeTab === 'resumen' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {/* Stats Grid */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-card-icon" style={{ background: '#fef3c7', color: '#d97706', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><BusinessIcon /></div>
              <div className="stat-card-value">{totalBusinesses}</div>
              <div className="stat-card-label">Establecimientos Totales</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-icon" style={{ background: '#d1fae5', color: '#059669', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><ActiveIcon /></div>
              <div className="stat-card-value">{activeCount}</div>
              <div className="stat-card-label">Suscripciones Activas</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-icon" style={{ background: '#fee2e2', color: '#dc2626', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><SuspendedIcon /></div>
              <div className="stat-card-value">{suspendedCount}</div>
              <div className="stat-card-label">Cuentas Suspendidas</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-icon" style={{ background: '#e0f2fe', color: '#0284c7', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><RevenueIcon /></div>
              <div className="stat-card-value">{formatPrice(projectedRevenue)}</div>
              <div className="stat-card-label">Suscripción Mensual Proyectada</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-icon" style={{ background: '#fee2e2', color: '#b91c1c', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><DebtIcon /></div>
              <div className="stat-card-value" style={{ color: totalDebt > 0 ? '#b91c1c' : 'inherit' }}>{formatPrice(totalDebt)}</div>
              <div className="stat-card-label">Deuda Total por Cobrar</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
            
            {/* Actividad Reciente WhatsApp */}
            <div className="card" style={{ padding: 'var(--space-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                <h3>Rendimiento WhatsApp API</h3>
                <span className="badge badge-success" style={{ fontSize: 11 }}>Conectado</span>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-lg)', marginBottom: 'var(--space-md)', background: 'var(--bg-secondary)', padding: 'var(--space-sm)', borderRadius: 8 }}>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: 'var(--success)' }}>{successMsgs}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Exitosos</div>
                </div>
                <div style={{ flex: 1, textAlign: 'center', borderLeft: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: 'var(--danger)' }}>{failedMsgs}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Fallidos</div>
                </div>
                <div style={{ flex: 1, textAlign: 'center', borderLeft: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: 24, fontWeight: 'bold' }}>{failedPercentage}%</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Tasa de Falla</div>
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                La API de WhatsApp Cloud se encarga de enviar las confirmaciones de turnos al instante y los recordatorios automáticos de forma unificada.
              </p>
            </div>

            {/* Ultimas Alertas */}
            <div className="card" style={{ padding: 'var(--space-md)' }}>
              <h3>Alertas del Sistema</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 'var(--space-sm)' }}>
                {businesses?.filter(b => b.debt > 0).map(b => (
                  <div 
                    key={b.id} 
                    style={{ 
                      padding: 10, 
                      borderRadius: 8, 
                      background: '#fffbeb', 
                      borderLeft: '4px solid #f59e0b',
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 600, fontSize: 13, color: '#92400e' }}>Deuda Pendiente: {b.name}</span>
                      <div style={{ fontSize: 11, color: '#b45309', marginTop: 2 }}>Abono mensual vencido.</div>
                    </div>
                    <span style={{ fontWeight: 'bold', color: '#b91c1c', fontSize: 13 }}>{formatPrice(b.debt)}</span>
                  </div>
                ))}
                {suspendedCount > 0 && (
                  <div 
                    style={{ 
                      padding: 10, 
                      borderRadius: 8, 
                      background: '#fef2f2', 
                      borderLeft: '4px solid #ef4444',
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 600, fontSize: 13, color: '#991b1b' }}>Establecimientos Suspendidos</span>
                      <div style={{ fontSize: 11, color: '#ef4444', marginTop: 2 }}>Hay salones con el acceso congelado por falta de pago.</div>
                    </div>
                    <span className="badge badge-danger">{suspendedCount} suspendidos</span>
                  </div>
                )}
                {/* Alerta de Cuota WhatsApp Excedida */}
                {businesses?.map(b => {
                  const sentCount = getMonthlyMessageCount(b.id);
                  if (sentCount > (b.whatsappQuota || 0)) {
                    const extraCount = sentCount - b.whatsappQuota;
                    const extraCostUSD = extraCount * 0.06;
                    return (
                      <div 
                        key={`quota-alert-${b.id}`} 
                        style={{ 
                          padding: 10, 
                          borderRadius: 8, 
                          background: '#fff5f5', 
                          borderLeft: '4px solid #f43f5e',
                          display: 'flex', 
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: 600, fontSize: 13, color: '#9f1239' }}>Cuota Excedida: {b.name}</span>
                          <div style={{ fontSize: 11, color: '#e11d48', marginTop: 2 }}>
                            Consumo: {sentCount}/{b.whatsappQuota} mensajes.
                            <span style={{ display: 'block', fontWeight: 600, color: '#e11d48', marginTop: 2 }}>
                              Extra: {extraCount} mensajes (+USD {extraCostUSD.toFixed(2)})
                            </span>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleOpenUpgradeModal(b)}
                          className="btn btn-danger" 
                          style={{ background: '#f43f5e', color: '#fff', fontSize: '11px', padding: '4px 10px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Ofrecer Upgrade
                        </button>
                      </div>
                    );
                  }
                  return null;
                })}
                {businesses?.filter(b => b.debt === 0 && !b.isFrozen).length === totalBusinesses && 
                 !businesses?.some(b => getMonthlyMessageCount(b.id) > (b.whatsappQuota || 0)) && (
                  <div className="empty-state" style={{ padding: 'var(--space-md)' }}>
                    <p>No hay alertas financieras ni de consumo pendientes. Todos los abonos están al día.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 2: TENANTS LIST */}
      {activeTab === 'tenants' && (
        <div className="card" style={{ padding: 'var(--space-md)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
            <h3 style={{ margin: 0 }}>Listado de Barberías y Salones</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Buscar por nombre o slug..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ margin: 0, width: 220 }}
              />
              <select
                className="form-input"
                value={tenantStatusFilter}
                onChange={e => setTenantStatusFilter(e.target.value)}
                style={{ margin: 0, width: 140 }}
              >
                <option value="all">Todos los Estados</option>
                <option value="active">Activos</option>
                <option value="frozen">Suspendidos</option>
              </select>
              <select
                className="form-input"
                value={tenantDebtFilter}
                onChange={e => setTenantDebtFilter(e.target.value)}
                style={{ margin: 0, width: 140 }}
              >
                <option value="all">Todas las Deudas</option>
                <option value="debt">Con Deuda</option>
                <option value="no_debt">Sin Deuda</option>
              </select>
            </div>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Establecimiento</th>
                <th>Estado</th>
                <th>Consumo WhatsApp</th>
                <th>Último Pago</th>
                <th>Próximo Cobro</th>
                <th>Abono</th>
                <th>Deuda Vencida</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredBusinesses.map(b => {
                const sentCount = getMonthlyMessageCount(b.id);
                const isExceeded = sentCount > (b.whatsappQuota || 0);

                return (
                  <tr key={b.id}>
                    <td>
                      <div>
                        <strong style={{ fontSize: 14 }}>{b.name}</strong>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          Slug: <span style={{ fontFamily: 'monospace' }}>/{b.slug}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${b.isFrozen ? 'badge-danger' : 'badge-success'}`}>
                        {b.isFrozen ? 'Suspendido' : 'Activo'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ 
                          fontSize: 13, 
                          fontWeight: isExceeded ? 'bold' : 'normal', 
                          color: isExceeded ? 'var(--danger)' : 'inherit' 
                        }}>
                          {sentCount} / {b.whatsappQuota}
                        </span>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                          este mes
                        </span>
                        {isExceeded && (
                          <>
                            <span style={{ fontSize: 11, color: 'var(--danger)', fontWeight: 600 }}>
                              +{sentCount - b.whatsappQuota} extra (+USD {((sentCount - b.whatsappQuota) * 0.06).toFixed(2)})
                            </span>
                            <button 
                              onClick={() => handleOpenUpgradeModal(b)}
                              className="badge badge-warning" 
                              style={{ fontSize: 9, padding: '2px 4px', width: 'fit-content', border: 'none', cursor: 'pointer', textAlign: 'left', marginTop: 2 }}
                            >
                              Ofrecer Upgrade
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: 13 }}>
                        {b.lastPaymentDate ? formatDate(b.lastPaymentDate).split(',')[1] : 'Ninguno'}
                      </span>
                    </td>
                    <td>
                      <span style={{ 
                        fontSize: 13, 
                        fontWeight: (b.debt > 0) ? 'bold' : 'normal',
                        color: (b.debt > 0) ? 'var(--danger)' : 'inherit'
                      }}>
                        {b.nextBillingDate ? formatDate(b.nextBillingDate).split(',')[1] : '—'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: 13 }}>{formatPrice(b.monthlyFee)}</span>
                    </td>
                    <td>
                      <span style={{ 
                        fontWeight: b.debt > 0 ? 'bold' : 'normal', 
                        color: b.debt > 0 ? 'var(--danger)' : 'var(--success)'
                      }}>
                        {formatPrice(b.debt)}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => handleToggleFreeze(b.id)}
                          className={`btn ${b.isFrozen ? 'btn-success' : 'btn-danger'}`}
                          style={{ padding: '6px 12px', fontSize: 12, minWidth: 100 }}
                        >
                          {b.isFrozen ? 'Habilitar' : 'Suspender'}
                        </button>
                        <button 
                          onClick={() => handleOpenPaymentModal(b)}
                          className="btn btn-outline"
                          style={{ padding: '6px 12px', fontSize: 12 }}
                        >
                          Registrar Pago
                        </button>
                        <button 
                          onClick={() => handleOpenUpgradeModal(b)}
                          className="btn btn-outline"
                          style={{ padding: '6px 12px', fontSize: 12 }}
                        >
                          Cambiar Plan
                        </button>
                        <button 
                          onClick={() => handleOpenDebtModal(b)}
                          className="btn btn-outline"
                          style={{ padding: '6px 12px', fontSize: 12 }}
                        >
                          Editar Saldo
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredBusinesses.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: 'var(--space-lg)' }}>
                    No se encontraron establecimientos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: GLOBAL APPOINTMENTS LOG */}
      {activeTab === 'citas' && (
        <div className="card" style={{ padding: 'var(--space-md)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
            <div>
              <h3 style={{ margin: 0 }}>Monitoreo Global de Turnos</h3>
              <p className="text-secondary" style={{ fontSize: 13, marginTop: 4, marginBottom: 0 }}>
                Auditoría en tiempo real de todos los turnos agendados en la plataforma SaciaTurno.
              </p>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              <select
                className="form-input"
                value={appointmentBusinessFilter}
                onChange={e => setAppointmentBusinessFilter(e.target.value)}
                style={{ margin: 0, width: 180 }}
              >
                <option value="all">Todas las Barberías</option>
                {businesses?.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input
                  type="date"
                  className="form-input"
                  value={appointmentDateFilter}
                  onChange={e => setAppointmentDateFilter(e.target.value)}
                  style={{ margin: 0, width: 140 }}
                />
                {appointmentDateFilter && (
                  <button 
                    onClick={() => setAppointmentDateFilter('')}
                    className="btn btn-outline"
                    style={{ padding: '6px 10px', fontSize: 11, color: 'var(--text-secondary)', borderColor: 'var(--border-color)', margin: 0 }}
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </div>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Fecha/Hora</th>
                <th>Establecimiento</th>
                <th>Profesional</th>
                <th>Cliente</th>
                <th>Servicio</th>
                <th>Monto</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.map((apt) => {
                const biz = businesses?.find(b => b.id === apt.businessId);
                const prof = professionals?.find(p => p.id === apt.professionalId);
                const srv = services?.find(s => s.id === apt.serviceId);
                
                return (
                  <tr key={apt.id}>
                    <td>
                      <div>
                        <strong style={{ fontSize: 13 }}>{apt.startTime}</strong>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          {formatDate(apt.appointmentDate).split(',')[1]}
                        </div>
                      </div>
                    </td>
                    <td>
                      <strong>{biz?.name || '—'}</strong>
                    </td>
                    <td>
                      <span style={{ fontSize: 13 }}>{prof?.name || '—'}</span>
                    </td>
                    <td>
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{apt.clientName || '—'}</span>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{apt.clientPhone || '—'}</div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: 13 }}>{apt.type === 'walkin' ? 'Servicio sin turno' : (srv?.name || '—')}</span>
                    </td>
                    <td>
                      <strong>{formatPrice(apt.price)}</strong>
                    </td>
                    <td>
                      <span className={`badge ${
                        apt.status === 'completada' ? 'badge-primary' : 
                        apt.status === 'confirmada' ? 'badge-success' : 
                        apt.status === 'pendiente' ? 'badge-warning' : 'badge-danger'
                      }`}>
                        {apt.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {(!filteredAppointments || filteredAppointments.length === 0) && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: 'var(--space-lg)' }}>
                    No se encontraron turnos con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: WHATSAPP CONFIG */}
      {activeTab === 'whatsapp' && (
        <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: 'var(--space-lg)' }}>
          {/* Info Card */}
          <div className="card" style={{ padding: 'var(--space-md)', alignSelf: 'start' }}>
            <h3>Status API de WhatsApp</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
              <span style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: 'var(--success)', display: 'inline-block' }}></span>
              <strong style={{ color: 'var(--success)' }}>Meta Cloud API Conectada</strong>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Las credenciales aquí configuradas se aplican de forma global para la entrega de confirmaciones y recordatorios de turnos automáticos.
            </p>
            <div style={{ borderTop: '1px solid var(--border-color)', marginTop: 'var(--space-md)', paddingTop: 'var(--space-md)', fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span className="text-muted">Mensajes hoy:</span>
                <strong>{successMsgs}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">Errores de envío:</span>
                <strong style={{ color: failedMsgs > 0 ? 'var(--danger)' : 'inherit' }}>{failedMsgs}</strong>
              </div>
            </div>
          </div>

          {/* Configuration Form */}
          <form onSubmit={handleSaveWhatsApp} className="card" style={{ padding: 'var(--space-md)' }}>
            <h3>Configuración Meta Cloud API</h3>
            
            {waSaved && (
              <div className="badge badge-success" style={{ display: 'block', padding: '8px 16px', marginBottom: 'var(--space-md)', borderRadius: 8 }}>
                Configuración de WhatsApp guardada exitosamente en la plataforma.
              </div>
            )}

            <div className="form-group" style={{ marginTop: 'var(--space-md)' }}>
              <label className="form-label">Phone Number ID (Meta)</label>
              <input
                type="text"
                className="form-input"
                value={waForm.phoneId}
                onChange={e => setWaForm({ ...waForm, phoneId: e.target.value })}
                placeholder="Ej: 105827364810293"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">System Access Token (Meta API)</label>
              <input
                type="password"
                className="form-input"
                value={waForm.token}
                onChange={e => setWaForm({ ...waForm, token: e.target.value })}
                placeholder="Token de acceso permanente de Meta Developer..."
                required
              />
            </div>

            <h4 style={{ marginTop: 'var(--space-lg)', borderBottom: '1px solid var(--border-color)', paddingBottom: 6 }}>Plantillas de Notificación</h4>
            <p className="text-secondary" style={{ fontSize: 12, marginBottom: 'var(--space-md)' }}>
              Estas plantillas deben estar aprobadas en la consola de Meta y usan variables: <strong>{"{{1}}"}</strong>: Nombre cliente, <strong>{"{{2}}"}</strong>: Salón, <strong>{"{{3}}"}</strong>: Fecha, <strong>{"{{4}}"}</strong>: Hora.
            </p>

            <div className="form-group">
              <label className="form-label">Confirmación de Turno</label>
              <textarea
                className="form-input"
                rows="3"
                value={waForm.templateConfirmation}
                onChange={e => setWaForm({ ...waForm, templateConfirmation: e.target.value })}
                placeholder="Plantilla de confirmación..."
                style={{ resize: 'vertical' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Recordatorio de Turno (T-24h / T-2h)</label>
              <textarea
                className="form-input"
                rows="3"
                value={waForm.templateReminder}
                onChange={e => setWaForm({ ...waForm, templateReminder: e.target.value })}
                placeholder="Plantilla de recordatorio..."
                style={{ resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 'var(--space-md)' }}>
              <button type="submit" className="btn btn-primary">
                Guardar Configuración WhatsApp
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 5: WHATSAPP LOGS */}
      {activeTab === 'logs' && (
        <div className="card" style={{ padding: 'var(--space-md)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
            <div>
              <h3 style={{ margin: 0 }}>Historial de Envíos de WhatsApp</h3>
              <p className="text-secondary" style={{ fontSize: 13, marginTop: 4, marginBottom: 0 }}>
                Monitoreo en tiempo real de notificaciones enviadas a clientes.
              </p>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              <select
                className="form-input"
                value={logBusinessFilter}
                onChange={e => setLogBusinessFilter(e.target.value)}
                style={{ margin: 0, width: 180 }}
              >
                <option value="all">Todas las Barberías</option>
                {businesses?.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <select
                className="form-input"
                value={logStatusFilter}
                onChange={e => setLogStatusFilter(e.target.value)}
                style={{ margin: 0, width: 130 }}
              >
                <option value="all">Todos los Estados</option>
                <option value="sent">Enviados</option>
                <option value="failed">Fallidos</option>
              </select>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input
                  type="date"
                  className="form-input"
                  value={logDateFilter}
                  onChange={e => setLogDateFilter(e.target.value)}
                  style={{ margin: 0, width: 140 }}
                />
                {logDateFilter && (
                  <button 
                    onClick={() => setLogDateFilter('')}
                    className="btn btn-outline"
                    style={{ padding: '6px 10px', fontSize: 11, color: 'var(--text-secondary)', borderColor: 'var(--border-color)', margin: 0 }}
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </div>
          </div>
          
          <table className="data-table">
            <thead>
              <tr>
                <th>Fecha/Hora</th>
                <th>Origen</th>
                <th>Destinatario</th>
                <th>Tipo</th>
                <th>Mensaje</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs?.map((log) => (
                <tr key={log.id}>
                  <td>
                    <span style={{ fontSize: 12 }}>
                      {log.sentAt ? log.sentAt.replace('T', ' ').substring(0, 16) : '—'}
                    </span>
                  </td>
                  <td>
                    <strong>{log.businessName}</strong>
                  </td>
                  <td>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{log.recipientName}</span>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{log.recipient}</div>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-neutral" style={{ fontSize: 11 }}>{log.type}</span>
                  </td>
                  <td>
                    <div style={{ fontSize: 12, maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={log.message}>
                      {log.message}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${log.status === 'sent' ? 'badge-success' : 'badge-danger'}`} title={log.error}>
                      {log.status === 'sent' ? 'Enviado' : 'Fallido'}
                    </span>
                  </td>
                </tr>
              ))}
              {(!filteredLogs || filteredLogs.length === 0) && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: 'var(--space-lg)' }}>
                    No se encontraron registros de envío con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* --- MODAL: REGISTRAR PAGO --- */}
      {modalType === 'payment' && selectedBusiness && (
        <div className="modal-overlay" onClick={() => setModalType(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3>Registrar Cobro de Abono</h3>
              <button className="modal-close" onClick={() => setModalType(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p className="text-secondary" style={{ marginBottom: 'var(--space-md)', fontSize: 13 }}>
                Registra un cobro mensual del abono para <strong>{selectedBusiness.name}</strong>. Se deducirá del saldo actual de deuda.
              </p>
              <div className="form-group">
                <label className="form-label">Deuda Actual</label>
                <div className="form-input" style={{ background: 'var(--bg-secondary)', fontWeight: 'bold' }}>
                  {formatPrice(selectedBusiness.debt)}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Monto Abonado (ARS)</label>
                <input
                  type="number"
                  className="form-input"
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                  placeholder="Monto..."
                  required
                  autoFocus
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setModalType(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleRecordPayment}>
                Confirmar Cobro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: EDITAR DEUDA --- */}
      {modalType === 'debt' && selectedBusiness && (
        <div className="modal-overlay" onClick={() => setModalType(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3>Modificar Saldo de Deuda</h3>
              <button className="modal-close" onClick={() => setModalType(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p className="text-secondary" style={{ marginBottom: 'var(--space-md)', fontSize: 13 }}>
                Ajusta manualmente la deuda de <strong>{selectedBusiness.name}</strong>. Esto define el estado final del saldo.
              </p>
              <div className="form-group">
                <label className="form-label">Monto Deuda (ARS)</label>
                <input
                  type="number"
                  className="form-input"
                  value={debtAmount}
                  onChange={e => setDebtAmount(e.target.value)}
                  placeholder="Monto..."
                  required
                  autoFocus
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setModalType(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleEditDebt}>
                Guardar Saldo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: OFRECER UPGRADE DE PLAN --- */}
      {modalType === 'upgrade' && selectedBusiness && (
        <div className="modal-overlay" onClick={() => setModalType(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
            <div className="modal-header">
              <h3>Ofrecer Upgrade de Plan</h3>
              <button className="modal-close" onClick={() => setModalType(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p className="text-secondary" style={{ marginBottom: 'var(--space-md)', fontSize: 13 }}>
                Actualiza el límite de mensajes de WhatsApp y la tarifa mensual de abono para <strong>{selectedBusiness.name}</strong>.
              </p>
              
              <div className="form-group" style={{ background: 'var(--bg-secondary)', padding: '10px 14px', borderRadius: 8, marginBottom: 'var(--space-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span className="text-muted">Cuota Actual:</span>
                  <strong>{selectedBusiness.whatsappQuota} mensajes/mes</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span className="text-muted">Abono Actual:</span>
                  <strong>{formatPrice(selectedBusiness.monthlyFee)}/mes</strong>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>Seleccionar Plan de Upgrade</label>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label className="card card-selectable" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', border: selectedPlan === 'basico' ? '2px solid var(--primary)' : '1px solid var(--border-color)', margin: 0 }}>
                    <input 
                      type="radio" 
                      name="upgradePlan" 
                      checked={selectedPlan === 'basico'} 
                      onChange={() => setSelectedPlan('basico')} 
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', fontSize: 13 }}>Plan Básico</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>100 mensajes/mes incluidos · $12.000 ARS/mes</div>
                    </div>
                  </label>

                  <label className="card card-selectable" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', border: selectedPlan === 'pro' ? '2px solid var(--primary)' : '1px solid var(--border-color)', margin: 0 }}>
                    <input 
                      type="radio" 
                      name="upgradePlan" 
                      checked={selectedPlan === 'pro'} 
                      onChange={() => setSelectedPlan('pro')} 
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', fontSize: 13 }}>Plan Pro</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>500 mensajes/mes incluidos · $22.000 ARS/mes</div>
                    </div>
                  </label>

                  <label className="card card-selectable" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', border: selectedPlan === 'business' ? '2px solid var(--primary)' : '1px solid var(--border-color)', margin: 0 }}>
                    <input 
                      type="radio" 
                      name="upgradePlan" 
                      checked={selectedPlan === 'business'} 
                      onChange={() => setSelectedPlan('business')} 
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', fontSize: 13 }}>Plan Business</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>2000 mensajes/mes incluidos · $35.000 ARS/mes</div>
                    </div>
                  </label>

                  <label className="card card-selectable" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', border: selectedPlan === 'personalizado' ? '2px solid var(--primary)' : '1px solid var(--border-color)', margin: 0 }}>
                    <input 
                      type="radio" 
                      name="upgradePlan" 
                      checked={selectedPlan === 'personalizado'} 
                      onChange={() => setSelectedPlan('personalizado')} 
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', fontSize: 13 }}>Plan Personalizado</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Configurar cuota y abono a medida</div>
                    </div>
                  </label>
                </div>
              </div>

              {selectedPlan === 'personalizado' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 'var(--space-md)' }}>
                  <div className="form-group">
                    <label className="form-label">Límite WhatsApp</label>
                    <input
                      type="number"
                      className="form-input"
                      value={upgradeQuota}
                      onChange={e => setUpgradeQuota(e.target.value)}
                      placeholder="mensajes/mes..."
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Abono Mensual (ARS)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={upgradeFee}
                      onChange={e => setUpgradeFee(e.target.value)}
                      placeholder="precio..."
                      required
                    />
                  </div>
                </div>
              )}

              <div style={{ marginTop: 'var(--space-md)', padding: 10, borderRadius: 8, background: '#f0f9ff', border: '1px solid #bae6fd', fontSize: 12, color: '#0369a1' }}>
                <strong>Consumo Excedente:</strong> Cada mensaje enviado por encima del cupo de su plan tendrá un costo de <strong>USD 0.06</strong> (con un margen del 50% sobre el costo real de envío).
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setModalType(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleRecordUpgrade}>
                Actualizar Plan
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
