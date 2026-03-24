import React, { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../utils/supabase';
import { cleanDigits, maskCPF, maskPhone } from '../utils/formatters';
import { captureUtmParams } from '../utils/utmCapture';
import PasswordRulesBox from './PasswordRulesBox';

const SST_APP_URL = import.meta.env.VITE_SST_APP_URL || 'https://sst.amengenhariaseg.com.br';

const DEFAULT_PARTNER_BRANDING = {
  name: '',
  logo_url: '',
  logo_url_light: '',
};

// Cores fixas AM - parceiros nao customizam cores
const AM_PRIMARY_COLOR = '#d4af37';
const AM_ACCENT_COLOR = '#22c55e';

const readPartnerBranding = (params) => ({
  ref: params.get('ref') || '',
  name: params.get('partner_name') || '',
  logo_url: params.get('partner_logo') || '',
  logo_url_light: params.get('partner_logo_light') || '',
});

const fetchPartnerBrandingByRef = async (referralCode) => {
  const normalizedRef = String(referralCode || '').trim().toLowerCase();
  if (!normalizedRef) return null;

  const { data, error } = await supabase.rpc('get_partner_public_branding', {
    p_referral_code: normalizedRef,
  });

  if (error) {
    throw error;
  }

  return data?.[0]
    ? {
        ref: data[0].referral_code || normalizedRef,
        name: data[0].partner_name || '',
        logo_url: data[0].logo_url || '',
        logo_url_light: data[0].logo_url_light || '',
      }
    : null;
};

// ─── Countdown Timer Hook ───
const useCountdown = (targetDate) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    const tick = () => {
      const diff = targetDate - Date.now();
      if (diff <= 0) { setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 }); return; }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000)
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);
  return timeLeft;
};

// ─── SVG Icons ───
const ShieldIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
);
const FileIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
);
const ClipboardIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
);
const UsersIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);
const CheckCircleIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
);
const BuildingIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><line x1="8" y1="6" x2="8" y2="6.01"/><line x1="12" y1="6" x2="12" y2="6.01"/><line x1="16" y1="6" x2="16" y2="6.01"/><line x1="8" y1="10" x2="8" y2="10.01"/><line x1="12" y1="10" x2="12" y2="10.01"/><line x1="16" y1="10" x2="16" y2="10.01"/><line x1="8" y1="14" x2="8" y2="14.01"/><line x1="12" y1="14" x2="12" y2="14.01"/><line x1="16" y1="14" x2="16" y2="14.01"/></svg>
);
const ChevronDown = ({ open }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.3s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}><polyline points="6 9 12 15 18 9"/></svg>
);

// ─── FAQ Accordion Item ───
const FAQItem = ({ question, answer }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid #333' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', padding: '1.25rem 0', background: 'none', border: 'none',
          color: '#f0f0f0', fontSize: '1.05rem', fontWeight: 600, cursor: 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left'
        }}
      >
        {question}
        <ChevronDown open={open} />
      </button>
      {open && <p style={{ color: '#9ca3af', margin: '0 0 1.25rem 0', lineHeight: '1.6', fontSize: '0.95rem' }}>{answer}</p>}
    </div>
  );
};

// ─── Input field style ───
const inputStyle = {
  width: '100%', padding: '0.9rem 1rem', borderRadius: '10px', border: '1px solid #444',
  background: '#111', color: '#f0f0f0', fontSize: '0.95rem', outline: 'none',
  boxSizing: 'border-box'
};

const inputLabelStyle = {
  display: 'block', color: '#9ca3af', fontSize: '0.8rem', fontWeight: 600,
  marginBottom: '0.4rem'
};

// ─── Navigation helper ───
const navigateToApp = (path) => {
  window.location.href = SST_APP_URL + path;
};

// ─── Registration Form Section ───
const RegistrationForm = ({ partnerBranding, isPartnerContext, primaryColor, accentColor, isSimulation }) => {
  const [contact, setContact] = useState({ name: '', email: '', cpf: '', phone: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const utmParams = useMemo(() => captureUtmParams(), []);

  const handleRegister = async () => {
    if (!contact.name.trim()) { setError('Informe seu nome completo.'); return; }
    if (!contact.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) { setError('Informe um e-mail valido.'); return; }
    const cleanCPF = cleanDigits(contact.cpf);
    if (cleanCPF.length !== 11) { setError('Informe um CPF valido com 11 digitos.'); return; }
    if (!contact.password || contact.password.length < 10) { setError('A senha deve ter no minimo 10 caracteres.'); return; }
    if (!/[a-z]/.test(contact.password)) { setError('A senha deve incluir ao menos uma letra minuscula.'); return; }
    if (!/[A-Z]/.test(contact.password)) { setError('A senha deve incluir ao menos uma letra maiuscula.'); return; }
    if (!/\d/.test(contact.password)) { setError('A senha deve incluir ao menos um numero.'); return; }
    if (!/[^A-Za-z0-9]/.test(contact.password)) { setError('A senha deve incluir ao menos um caractere especial.'); return; }
    if (contact.password !== contact.confirmPassword) { setError('As senhas nao coincidem.'); return; }

    setLoading(true);
    setError(null);

    try {
      // Get partner ref from session
      let partnerRef = null;
      try { partnerRef = sessionStorage.getItem('am_partner_ref'); } catch (_) { /* noop */ }

      // Register via edge function
      const res = await supabase.functions.invoke('register-lead', {
        body: {
          name: contact.name.trim(),
          email: contact.email.trim().toLowerCase(),
          password: contact.password,
          cpf: cleanCPF,
          phone: cleanDigits(contact.phone) || undefined,
          partner_ref: partnerRef || undefined,
          force_overwrite: isSimulation || undefined,
          utm_source: utmParams.utm_source || undefined,
          utm_medium: utmParams.utm_medium || undefined,
          utm_campaign: utmParams.utm_campaign || undefined
        }
      });

      if (res.error) {
        let errorMsg = res.data?.error || '';
        if (!errorMsg) {
          try {
            const body = await res.error.context?.json?.();
            if (body?.error) errorMsg = body.error;
          } catch (_) { /* body ja consumido */ }
        }
        setError(errorMsg || 'Erro ao processar cadastro.');
        return;
      }

      const data = res.data;
      if (!data?.success) {
        setError(data?.error || 'Erro ao criar conta.');
        return;
      }

      // Redirect to main app login page
      navigateToApp('/cliente');
    } catch (err) {
      console.error('[SalesLanding] Erro no cadastro:', err);
      setError('Erro de conexao. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '480px', width: '100%', margin: '0 auto' }}>
      <div style={{
        background: '#1a1a1a', border: '1px solid #333', borderRadius: '16px',
        padding: '2rem', boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
      }}>
        <h3 style={{ color: '#f0f0f0', margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 700 }}>
          {isPartnerContext ? `Solicite seu diagnostico com ${partnerBranding?.name || 'o parceiro'}` : 'Cadastre-se para analisar sua empresa'}
        </h3>
        <p style={{ color: '#9ca3af', margin: '0 0 1.5rem 0', fontSize: '0.9rem' }}>
          {isPartnerContext
            ? 'Preencha seus dados e receba a analise regulatoria inicial do seu CNPJ.'
            : 'Crie sua conta para acessar a analise regulatoria gratuita do seu CNPJ.'}
        </p>

        {isPartnerContext && (
          <div style={{
            marginBottom: '1.25rem',
            padding: '0.85rem 1rem',
            borderRadius: '12px',
            border: `1px solid ${accentColor}44`,
            background: `${accentColor}12`
          }}>
            <p style={{ color: '#d1d5db', margin: 0, fontSize: '0.84rem', lineHeight: 1.6 }}>
              Ao se cadastrar, voce recebera um diagnostico regulatorio completo e podera contratar a regularizacao diretamente com <strong style={{ color: primaryColor }}>{partnerBranding?.name || 'nosso time'}</strong>.
            </p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={inputLabelStyle}>Nome completo *</label>
            <input
              type="text"
              placeholder="Seu nome"
              value={contact.name}
              onChange={(e) => { setContact(p => ({ ...p, name: e.target.value })); setError(null); }}
              style={inputStyle}
              disabled={loading}
            />
          </div>
          <div>
            <label style={inputLabelStyle}>E-mail *</label>
            <input
              type="email"
              placeholder="seu@email.com"
              value={contact.email}
              onChange={(e) => { setContact(p => ({ ...p, email: e.target.value })); setError(null); }}
              style={inputStyle}
              disabled={loading}
            />
            <p style={{ color: '#6b7280', margin: '0.3rem 0 0 0', fontSize: '0.75rem' }}>
              Este sera seu e-mail de acesso ao sistema
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={inputLabelStyle}>CPF *</label>
              <input
                type="text"
                placeholder="000.000.000-00"
                value={contact.cpf}
                onChange={(e) => { setContact(p => ({ ...p, cpf: maskCPF(e.target.value) })); setError(null); }}
                style={{ ...inputStyle, fontFamily: 'monospace', letterSpacing: '0.5px' }}
                disabled={loading}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={inputLabelStyle}>Telefone</label>
              <input
                type="text"
                placeholder="(00) 00000-0000"
                value={contact.phone}
                onChange={(e) => { setContact(p => ({ ...p, phone: maskPhone(e.target.value) })); setError(null); }}
                style={{ ...inputStyle, fontFamily: 'monospace', letterSpacing: '0.5px' }}
                disabled={loading}
              />
            </div>
          </div>
          <div>
            <label style={inputLabelStyle}>Senha *</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Minimo 10 caracteres"
                value={contact.password}
                onChange={(e) => { setContact(p => ({ ...p, password: e.target.value })); setError(null); }}
                style={{ ...inputStyle, paddingRight: '3rem' }}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '0.8rem', padding: '4px' }}
              >
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            <PasswordRulesBox password={contact.password} />
          </div>
          <div>
            <label style={inputLabelStyle}>Confirmar senha *</label>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Repita a senha"
              value={contact.confirmPassword}
              onChange={(e) => { setContact(p => ({ ...p, confirmPassword: e.target.value })); setError(null); }}
              style={inputStyle}
              disabled={loading}
            />
          </div>
        </div>

        {error && (
          <p style={{ color: '#ef4444', margin: '1rem 0 0 0', fontSize: '0.9rem' }}>{error}</p>
        )}

        <button
          onClick={handleRegister}
          disabled={loading}
          style={{
            width: '100%', padding: '1rem', borderRadius: '10px', border: 'none',
            background: loading ? '#555' : primaryColor, color: loading ? '#999' : '#121212',
            fontWeight: 700, fontSize: '1.05rem',
            cursor: loading ? 'default' : 'pointer', transition: 'all 0.2s', marginTop: '1.5rem'
          }}
          onMouseOver={(e) => { if (!loading) { e.currentTarget.style.background = accentColor; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
          onMouseOut={(e) => { if (!loading) { e.currentTarget.style.background = primaryColor; e.currentTarget.style.transform = 'translateY(0)'; } }}
        >
          {loading ? 'Criando conta...' : isPartnerContext ? 'Continuar com atendimento do parceiro' : 'Criar conta e analisar CNPJ'}
        </button>
        <p style={{ color: '#6b7280', margin: '0.75rem 0 0 0', fontSize: '0.8rem', textAlign: 'center' }}>
          Seus dados estao seguros. Ja tem conta?{' '}
          <button
            onClick={() => navigateToApp('/cliente')}
            style={{ background: 'none', border: 'none', color: primaryColor, cursor: 'pointer', fontSize: '0.8rem', padding: 0, textDecoration: 'underline' }}
          >
            Faca login
          </button>
        </p>
        <p style={{ color: '#4b5563', margin: '0.4rem 0 0 0', fontSize: '0.7rem', textAlign: 'center' }}>
          {isPartnerContext
            ? 'Seu cadastro abre a jornada comercial neste canal parceiro e sera aproveitado quando sua empresa avancar para a contratacao oficial.'
            : 'Ao se cadastrar, voce recebera um e-mail com seus dados de acesso. Estas credenciais serao as mesmas quando sua empresa se tornar cliente.'}
        </p>
      </div>
    </div>
  );
};

// ─── Main Page ───
const DEFAULTS = {
  hero_headline: 'Novas Multas da NR-1: Regularize seu PGR e PCMSO Agora!',
  hero_subheadline: 'A partir de 26 de maio de 2026 comecam as fiscalizacoes e multas. Assista ao video e veja como adaptar sua empresa a NR-1 de forma rapida, acessivel e 100% digital.',
  show_video_section: true,
  video_url: null,
  video_placeholder_text: '[INSIRA O VIDEO AQUI - COLE O IFRAME DO SEU VSL]',
  hero_cta_text: 'QUERO REGULARIZAR MINHA EMPRESA AGORA',
  hero_sub_cta: 'Protecao juridica, tecnica e OBRIGATORIA para empresas com 1 ou mais colaboradores.',
  countdown_date: '2026-05-26T00:00:00-03:00',
  countdown_label: 'Fiscalizacao oficial: 26 de maio de 2026',
  urgency_title: 'O prazo de adaptacao esta acabando. Voce esta preparado?',
  urgency_body: 'A atualizacao da NR-1 trouxe uma mudanca profunda: agora, alem dos riscos fisicos, sua empresa e obrigada a incluir os riscos psicossociais (saude mental) no PGR (Programa de Gerenciamento de Riscos). O Ministerio do Trabalho (MTE) ja deu o aviso: a fiscalizacao rigorosa com aplicacao de multas comeca oficialmente em 26 de maio de 2026.',
  urgency_consequences_title: 'O que isso significa para voce?',
  urgency_consequences_intro: 'Nao e apenas "mais um papel". Se o seu PGR nao contemplar as novas regras, a fiscalizacao identifica a irregularidade e aplica multas.',
  urgency_consequences_items: [
    { label: 'Multas para pequenas empresas', text: 'Podem variar de R$ 15.000 a R$ 30.000 por infracao.' },
    { label: 'Risco Juridico', text: 'Sem esses laudos, voce perde qualquer defesa em processos trabalhistas.' }
  ],
  solution_title: 'Documentacao Profissional sem Burocracia para sua Empresa.',
  solution_subtitle: 'Nos cuidamos da complexidade tecnica para que voce foque no seu negocio. Entregamos a solucao completa exigida por lei, 100% adaptada as novas normas:',
  solution_cards: [
    { title: 'PGR', subtitle: 'Programa de Gerenciamento de Riscos', description: 'Identificacao completa de riscos fisicos, quimicos, biologicos e agora, os psicossociais.', signed_by: 'Assinado por Engenheiro de Seguranca' },
    { title: 'PCMSO', subtitle: 'Programa de Controle Medico de Saude Ocupacional', description: 'O plano de exames medicos baseado nos riscos encontrados na sua empresa.', signed_by: 'Assinado por Medico do Trabalho' },
    { title: 'DIR', subtitle: 'Declaracao de Inexistencia de Risco', description: 'Para empresas que se enquadram na NR-1 item 1.8.4 e nao possuem riscos ocupacionais relevantes.', signed_by: 'Assinado por Engenheiro de Seguranca' }
  ],
  solution_esocial_text: 'Tudo pronto para o eSocial: Geramos os arquivos necessarios para voce ficar em dia com o governo de forma transparente e rapida.',
  show_technology_section: true,
  technology_title: 'Controle tudo na palma da sua mao com o Portal AM Smart.',
  technology_subtitle: 'Chega de pastas de arquivos pegando poeira. Ao contratar a AM Engenharia, voce ganha acesso exclusivo a nossa plataforma:',
  technology_mockup_url: null,
  technology_features: [
    { title: 'Gestao Digital', description: 'Acesse laudos, certificados e treinamentos de qualquer lugar.' },
    { title: 'Alertas de Vencimento', description: 'Nunca mais perca a data de renovacao de um laudo ou exame medico.' },
    { title: 'Tecnologia Avancada', description: 'Resume laudos complexos em segundos para que voce saiba exatamente o que fazer.' }
  ],
  audience_title: 'Nao importa o tamanho, a lei e para todos.',
  audience_subtitle: 'Se voce tem um ou mais colaboradores, voce e o alvo principal da fiscalizacao digital.',
  audience_cards: [
    { emoji: '🏢', title: 'Escritorios e Consultorios', description: 'Baixo risco, mas obrigatoriedade total de documentacao.' },
    { emoji: '🛒', title: 'Comercios e Lojas', description: 'Varejo com fluxo de pessoas e colaboradores registrados.' },
    { emoji: '🏭', title: 'Micro e Pequenas Industrias', description: 'Onde o risco e maior e a protecao precisa ser robusta.' },
    { emoji: '🧑‍🔧', title: 'MEIs com Colaborador', description: 'Sim, voce tambem precisa estar regularizado para evitar multas.' }
  ],
  authority_title: 'Nao somos uma "fabrica de laudos". Somos uma autoridade nacional.',
  authority_subtitle: 'Know-how tecnico que protege empresas do faturamento de R$ 100 mil ao R$ 100 milhoes.',
  authority_cards: [
    { emoji: '🏗️', title: 'Experiencia Comprovada', description: 'Gerenciamos a seguranca de grandes industrias com mais de 6.000 colaboradores.' },
    { emoji: '🏅', title: 'Selo de Qualidade', description: 'Know-how tecnico que protege empresas de todos os portes e setores do Brasil.' },
    { emoji: '🗺️', title: 'Presenca Nacional', description: 'Equipe tecnica pronta com o rigor que a lei exige e o preco que cabe no bolso.' }
  ],
  authority_stats: [
    { value: '+6.000', label: 'Vidas protegidas em operacoes atendidas' },
    { value: 'R$ 100mi+', label: 'Patrimonio protegido com nossos laudos' },
    { value: '100% Digital', label: 'Documentos entregues online' }
  ],
  cta_title: 'Proteja seu patrimonio e durma tranquilo.',
  cta_body: 'O custo da conformidade e infinitamente menor do que o preco de uma multa ou de um processo trabalhista. Nao deixe para a ultima hora - Maio de 2026 chega mais rapido do que voce imagina.',
  cta_button_text: 'QUERO MEU ORCAMENTO E REGULARIZACAO AGORA',
  cta_sub_text: 'Fale com um especialista e receba o diagnostico gratuito da sua empresa.',
  faq_title: 'Perguntas Frequentes',
  faq_items: [
    { question: 'MEI precisa de PGR e PCMSO?', answer: 'MEI que nao possui empregados e exerce atividades de grau de risco 1 e 2 esta dispensado do PGR (NR-01.8.4). Nesse caso, emitimos a DIR (Declaracao de Inexistencia de Risco). Se o MEI tiver colaboradores registrados, a obrigatoriedade e total.' },
    { question: 'Quanto tempo demora para ficar regularizado?', answer: 'Apos a contratacao, voce recebe acesso imediato ao sistema. O PGR e gerado de forma automatizada e revisado por nossa equipe tecnica. O prazo medio e de ate 5 dias uteis para entrega completa.' },
    { question: 'Como recebo os arquivos e laudos?', answer: 'Todos os documentos ficam disponiveis no Portal AM Smart, nossa plataforma digital. Voce acessa de qualquer lugar, a qualquer momento, e pode baixar os PDFs assinados diretamente pelo sistema.' },
    { question: 'Quais tipos de empresa voces atendem?', answer: 'Atendemos empresas de todos os portes e setores: escritorios, comercios, industrias, clinicas, MEIs com colaboradores e muito mais. Nosso sistema se adapta ao grau de risco e porte da sua empresa automaticamente.' }
  ]
};

const SalesLandingPage = ({ isSimulation }) => {
  const [cfg, setCfg] = useState(DEFAULTS);
  const [partnerBranding, setPartnerBranding] = useState(DEFAULT_PARTNER_BRANDING);
  const ctaRef = useRef(null);
  const formRef = useRef(null);

  useEffect(() => {
    supabase.from('sales_page_config').select('*').eq('singleton_key', true).single()
      .then(({ data }) => { if (data) setCfg({ ...DEFAULTS, ...data }); })
      .catch((err) => console.error('[SalesLP] Erro ao carregar config:', err));
  }, []);

  const deadline = useMemo(() => new Date(cfg.countdown_date), [cfg.countdown_date]);
  const countdown = useCountdown(deadline);

  useEffect(() => {
    let active = true;

    const loadPartnerBranding = async () => {
      const params = new URLSearchParams(window.location.search);
      const brandingFromQuery = readPartnerBranding(params);
      const resolvedRef = brandingFromQuery.ref;

      if (resolvedRef) {
        try { sessionStorage.setItem('am_partner_ref', resolvedRef); } catch (storageError) { console.error('[SalesLP] Erro ao salvar ref do parceiro:', storageError); }
      }

      let storedBranding = null;
      try {
        const stored = sessionStorage.getItem('am_partner_branding');
        storedBranding = stored ? JSON.parse(stored) : null;
      } catch (storageError) {
        console.error('[SalesLP] Erro ao ler branding em cache:', storageError);
      }

      let remoteBranding = null;
      if (resolvedRef && !(brandingFromQuery.name || brandingFromQuery.logo_url)) {
        try {
          remoteBranding = await fetchPartnerBrandingByRef(resolvedRef);
        } catch (error) {
          console.error('[SalesLP] Erro ao carregar branding publico do parceiro:', error);
        }
      }

      const queryOverrides = { ref: resolvedRef || brandingFromQuery.ref };
      if (brandingFromQuery.name) queryOverrides.name = brandingFromQuery.name;
      if (brandingFromQuery.logo_url) queryOverrides.logo_url = brandingFromQuery.logo_url;
      if (brandingFromQuery.logo_url_light) queryOverrides.logo_url_light = brandingFromQuery.logo_url_light;

      const nextBranding = {
        ...DEFAULT_PARTNER_BRANDING,
        ...(storedBranding || {}),
        ...(remoteBranding || {}),
        ...(resolvedRef || brandingFromQuery.name || brandingFromQuery.logo_url ? queryOverrides : {}),
      };

      if (!active) return;

      setPartnerBranding(nextBranding);
      if (nextBranding.ref || nextBranding.name || nextBranding.logo_url) {
        try {
          sessionStorage.setItem('am_partner_branding', JSON.stringify(nextBranding));
        } catch (storageError) {
          console.error('[SalesLP] Erro ao salvar branding em cache:', storageError);
        }
      }
    };

    loadPartnerBranding();

    return () => {
      active = false;
    };
  }, []);

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: 'smooth' });
  const scrollToCTA = () => ctaRef.current?.scrollIntoView({ behavior: 'smooth' });
  const isPartnerContext = Boolean(partnerBranding?.ref || partnerBranding?.name);
  const primaryColor = AM_PRIMARY_COLOR;
  const accentColor = AM_ACCENT_COLOR;
  const partnerName = partnerBranding?.name || 'Parceiro credenciado';
  const heroHeadline = isPartnerContext
    ? `Regularize sua empresa na NR-1 com ${partnerName}`
    : cfg.hero_headline;
  const heroSubtitle = isPartnerContext
    ? `${partnerName} oferece a solucao completa de regularizacao NR-1: PGR, PCMSO, portal do cliente e entrega 100% digital.`
    : cfg.hero_subheadline;
  const heroCtaText = isPartnerContext ? `QUERO REGULARIZAR COM ${partnerName.toUpperCase()}` : cfg.hero_cta_text;
  const heroSubCta = isPartnerContext
    ? 'Diagnostico regulatorio gratuito, processo 100% digital e documentos assinados entregues online.'
    : cfg.hero_sub_cta;
  const partnerJourney = isPartnerContext ? [
    {
      icon: <UsersIcon key="partner-sales" />,
      title: `Atendimento por ${partnerName}`,
      description: 'Alinhamento de oferta, proposta comercial e acompanhamento personalizado do inicio ao fim.'
    },
    {
      icon: <BuildingIcon key="partner-contract" />,
      title: 'Contratacao 100% digital',
      description: 'Pagamento seguro, portal do cliente e acompanhamento de todo o processo online.'
    },
    {
      icon: <ShieldIcon key="partner-delivery" />,
      title: 'Entrega tecnica validada',
      description: 'PGR, PCMSO e documentos assinados digitalmente, prontos para fiscalizacao.'
    }
  ] : [];

  const solutionIcons = [
    <FileIcon key="pgr" />,
    <ClipboardIcon key="pcmso" />,
    <ShieldIcon key="dir" />
  ];

  const solutionGridTemplate = useMemo(() => {
    const count = (cfg.solution_cards || []).length;
    if (count === 3) return 'repeat(auto-fit, minmax(260px, 1fr))';
    if (count === 4) return 'repeat(auto-fit, minmax(300px, 1fr))';
    return 'repeat(auto-fit, minmax(280px, 1fr))';
  }, [cfg.solution_cards]);

  return (
    <div style={s.page}>
      {/* ───── STICKY HEADER ───── */}
      <header style={s.header}>
        <div style={s.headerInner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {partnerBranding?.logo_url ? (
              <img src={partnerBranding.logo_url} alt={partnerBranding.name || 'Parceiro'} style={{ height: '56px', width: 'auto', maxWidth: '220px', objectFit: 'contain' }} />
            ) : (
              <img src="/am-logo-branca.png" alt="AM Engenharia" style={{ height: '44px', width: 'auto' }} />
            )}
            <button onClick={scrollToForm} style={{ ...s.headerCta, background: primaryColor }}>
              {isPartnerContext ? `Falar com ${partnerName}` : 'Regularizar Agora'}
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ ...s.headerBadge, color: primaryColor, border: `1px solid ${primaryColor}40`, background: `${primaryColor}12` }}>
              {isPartnerContext ? `Regularizacao NR-1` : 'OBRIGATORIEDADE NR-1 - 2026'}
            </span>
            <nav style={s.nav}>
              <button onClick={() => navigateToApp('/cliente')} style={s.navLink}>Ja sou cliente</button>
              {!isPartnerContext && <button onClick={() => navigateToApp('/parceiro')} style={s.navLink}>Sou parceiro</button>}
              {!isPartnerContext && <button onClick={() => navigateToApp('/admin')} style={s.navLinkSubtle}>Acesso AM</button>}
            </nav>
          </div>
        </div>
      </header>

      {/* ───── FOLD 1: HERO + VSL ───── */}
      <section style={s.hero}>
        <div style={s.container}>
          <img src={partnerBranding?.logo_url || '/am-logo-branca.png'} alt={partnerBranding?.name || 'AM Engenharia'} style={{ height: '140px', width: 'auto', maxWidth: '400px', objectFit: 'contain', marginBottom: '2rem' }} />
          <h1 style={s.heroTitle}>{heroHeadline}</h1>
          <p style={s.heroSubtitle}>{heroSubtitle}</p>

          {/* Video embed (optional) */}
          {cfg.show_video_section !== false && (
            <div style={s.videoWrapper}>
              {cfg.video_url ? (
                <iframe
                  src={cfg.video_url}
                  style={s.videoIframe}
                  title="Video de apresentacao"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              ) : (
                <div style={s.videoPlaceholder}>
                  <span style={{ fontSize: '3rem' }}>🎬</span>
                  <p style={{ color: '#6b7280', margin: '1rem 0 0 0', fontSize: '0.95rem' }}>{cfg.video_placeholder_text}</p>
                </div>
              )}
            </div>
          )}

          <button onClick={scrollToForm} style={{ ...s.ctaButton, background: primaryColor }}
            onMouseOver={(e) => { e.currentTarget.style.background = accentColor; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = primaryColor; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            🚀 {heroCtaText}
          </button>
          <p style={{ color: '#9ca3af', margin: '1rem 0 0 0', fontSize: '0.9rem' }}>
            🔒 {heroSubCta}
          </p>
        </div>
      </section>

      {isPartnerContext && (
        <section style={{ ...s.section, padding: '3rem 0', background: '#0b0b0b' }}>
          <div style={s.container}>
            <div style={s.sectionBadge}>COMO FUNCIONA</div>
            <h2 style={s.sectionTitle}>Sua regularizacao em 3 passos simples</h2>
            <p style={s.sectionSubtitle}>
              {partnerName} cuida de todo o processo para voce. Do diagnostico a entrega dos documentos, tudo de forma rapida e digital.
            </p>
            <div style={{ ...s.cardGrid, gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
              {partnerJourney.map((item) => (
                <div key={item.title} style={s.partnerJourneyCard}>
                  <div style={{ marginBottom: '1rem' }}>{item.icon}</div>
                  <h3 style={{ color: '#f8fafc', margin: '0 0 0.5rem 0', fontSize: '1.05rem' }}>{item.title}</h3>
                  <p style={{ color: '#9ca3af', margin: 0, fontSize: '0.9rem', lineHeight: 1.6 }}>{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ───── FOLD 2: URGENCY + COUNTDOWN ───── */}
      <section style={{ ...s.section, background: '#0c0c0c' }}>
        <div style={s.container}>
          <h2 style={s.sectionTitle}>{cfg.urgency_title}</h2>
          <p style={{ color: '#d1d5db', fontSize: '1.05rem', lineHeight: 1.7, maxWidth: '800px', margin: '0 auto 2.5rem auto', textAlign: 'center' }}>
            {cfg.urgency_body}
          </p>

          {/* Countdown */}
          <div style={s.countdownRow}>
            <p style={{ color: '#9ca3af', fontSize: '0.85rem', margin: '0 0 0.75rem 0', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600 }}>
              {cfg.countdown_label}
            </p>
            <div style={s.countdownGrid}>
              {[
                { value: countdown.days, label: 'DIAS' },
                { value: countdown.hours, label: 'HORAS' },
                { value: countdown.minutes, label: 'MIN' },
                { value: countdown.seconds, label: 'SEG' }
              ].map((item) => (
                <div key={item.label} style={s.countdownBox}>
                  <span style={s.countdownValue}>{String(item.value).padStart(2, '0')}</span>
                  <span style={s.countdownLabel}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Consequences */}
          <div style={{ maxWidth: '800px', margin: '3rem auto 0 auto' }}>
            <h3 style={{ color: '#f0f0f0', fontSize: '1.3rem', fontWeight: 700, margin: '0 0 1rem 0', textAlign: 'center' }}>
              {cfg.urgency_consequences_title}
            </h3>
            <p style={{ color: '#d1d5db', lineHeight: 1.7, fontSize: '0.95rem', margin: '0 0 1.5rem 0', textAlign: 'center' }}>
              {cfg.urgency_consequences_intro}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {(cfg.urgency_consequences_items || []).map((item, i) => (
                <div key={i} style={{ background: '#1a1111', border: '1px solid #7f1d1d', borderRadius: '12px', padding: '1.25rem 1.5rem' }}>
                  <strong style={{ color: '#fca5a5' }}>{item.label}:</strong>
                  <span style={{ color: '#d1d5db', marginLeft: '0.5rem' }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={s.anchorBadge} onClick={() => document.getElementById('section-solution')?.scrollIntoView({ behavior: 'smooth' })}>
            📋 NOSSA SOLUCAO COMPLETA
          </div>
        </div>
      </section>

      {/* ───── FOLD 3: SOLUTION (PGR + PCMSO) ───── */}
      <section id="section-solution" style={s.section}>
        <div style={s.container}>
          <div style={s.sectionBadge}>📋 NOSSA SOLUCAO COMPLETA</div>
          <h2 style={s.sectionTitle}>{cfg.solution_title}</h2>
          <p style={s.sectionSubtitle}>{cfg.solution_subtitle}</p>

          <div style={{ ...s.cardGrid, gridTemplateColumns: solutionGridTemplate }}>
            {(cfg.solution_cards || []).map((card, i) => (
              <div key={i} style={s.solutionCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  {solutionIcons[i] || <ShieldIcon />}
                  <h3 style={{ color: '#d4af37', fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>{card.title}</h3>
                </div>
                <p style={{ color: '#9ca3af', fontSize: '0.9rem', margin: '0 0 0.75rem 0', fontWeight: 600 }}>{card.subtitle}</p>
                <p style={{ color: '#d1d5db', fontSize: '0.95rem', lineHeight: 1.6, margin: '0 0 1rem 0' }}>{card.description}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#22c55e', fontSize: '0.9rem', fontWeight: 600 }}>
                  <CheckCircleIcon size={16} /> {card.signed_by}
                </div>
              </div>
            ))}
          </div>

          {cfg.solution_esocial_text && (
          <div style={s.esocialCallout}>
            <span style={{ fontSize: '1.5rem' }}>✅</span>
            <p style={{ color: '#d1d5db', margin: 0, fontSize: '1rem', fontWeight: 600, lineHeight: 1.5 }}>
              {cfg.solution_esocial_text}
            </p>
          </div>
          )}

          <div style={s.anchorBadge} onClick={() => document.getElementById('section-technology')?.scrollIntoView({ behavior: 'smooth' })}>
            💻 TECNOLOGIA EXCLUSIVA
          </div>
        </div>
      </section>

      {/* ───── FOLD 4: PORTAL AM SMART ───── */}
      {cfg.show_technology_section !== false && (
        <section id="section-technology" style={{ ...s.section, background: '#0c0c0c' }}>
          <div style={s.container}>
            <div style={s.sectionBadge}>💻 TECNOLOGIA EXCLUSIVA</div>
            <h2 style={s.sectionTitle}>{isPartnerContext ? `Portal exclusivo para clientes de ${partnerName}` : cfg.technology_title}</h2>
            <p style={s.sectionSubtitle}>{isPartnerContext ? `Acesse seus documentos, acompanhe o andamento e baixe seus PDFs assinados a qualquer momento pelo portal digital.` : cfg.technology_subtitle}</p>

            <div style={{ display: 'flex', gap: '3rem', alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'center' }}>
              <div style={s.mockupContainer}>
                {cfg.technology_mockup_url ? (
                  <img src={cfg.technology_mockup_url} alt="Portal AM Smart" style={{ width: '100%', borderRadius: '12px' }} />
                ) : (
                  <div style={s.mockupPlaceholder}>
                    <span style={{ fontSize: '3rem' }}>📱</span>
                    <p style={{ color: '#6b7280', margin: '0.75rem 0 0 0', fontSize: '0.9rem' }}>Espaco para mockup / print do Portal AM Smart</p>
                  </div>
                )}
              </div>

              <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {(cfg.technology_features || []).map((feat, i) => (
                  <div key={i} style={s.featureItem}>
                    <div style={s.featureCheck}>✓</div>
                    <div>
                      <h4 style={{ color: '#f0f0f0', margin: '0 0 0.25rem 0', fontSize: '1.05rem', fontWeight: 700 }}>{feat.title}</h4>
                      <p style={{ color: '#9ca3af', margin: 0, fontSize: '0.9rem', lineHeight: 1.5 }}>{feat.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={s.anchorBadge} onClick={() => document.getElementById('section-audience')?.scrollIntoView({ behavior: 'smooth' })}>
              🎯 PARA QUEM E?
            </div>
          </div>
        </section>
      )}

      {/* ───── FOLD 5: TARGET AUDIENCE ───── */}
      <section id="section-audience" style={s.section}>
        <div style={s.container}>
          <div style={s.sectionBadge}>🎯 PARA QUEM E?</div>
          <h2 style={s.sectionTitle}>{cfg.audience_title}</h2>
          <p style={s.sectionSubtitle}>{cfg.audience_subtitle}</p>

          <div style={{ ...s.cardGrid, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            {(cfg.audience_cards || []).map((card, i) => (
              <div key={i} style={{ ...s.card, textAlign: 'center', padding: '2rem 1.5rem' }}>
                <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '1rem' }}>{card.emoji}</span>
                <h3 style={{ color: '#f0f0f0', margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 700 }}>{card.title}</h3>
                <p style={{ color: '#9ca3af', margin: 0, fontSize: '0.9rem', lineHeight: 1.5 }}>{card.description}</p>
              </div>
            ))}
          </div>

          <div style={s.anchorBadge} onClick={() => document.getElementById('section-authority')?.scrollIntoView({ behavior: 'smooth' })}>
            {isPartnerContext ? `🏆 POR QUE ${partnerName.toUpperCase()}?` : '🏆 POR QUE A AM ENGENHARIA?'}
          </div>
        </div>
      </section>

      {/* ───── FOLD 6: AUTHORITY ───── */}
      <section id="section-authority" style={{ ...s.section, background: '#0c0c0c' }}>
        <div style={s.container}>
          <div style={s.sectionBadge}>{isPartnerContext ? `🏆 POR QUE ${partnerName.toUpperCase()}?` : '🏆 POR QUE A AM ENGENHARIA?'}</div>
          <h2 style={s.sectionTitle}>{isPartnerContext ? `Regularizacao NR-1 com estrutura profissional e entrega garantida` : cfg.authority_title}</h2>
          <p style={s.sectionSubtitle}>{isPartnerContext ? `${partnerName} oferece uma solucao completa com tecnologia de ponta, equipe tecnica especializada e documentos validos para fiscalizacao.` : cfg.authority_subtitle}</p>

          <div style={{ ...s.cardGrid, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', marginBottom: '3rem' }}>
            {(cfg.authority_cards || []).map((card, i) => (
              <div key={i} style={{ ...s.card, textAlign: 'center', padding: '2rem 1.5rem' }}>
                <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '1rem' }}>{card.emoji}</span>
                <h3 style={{ color: '#f0f0f0', margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 700 }}>{card.title}</h3>
                <p style={{ color: '#9ca3af', margin: 0, fontSize: '0.9rem', lineHeight: 1.5 }}>{card.description}</p>
              </div>
            ))}
          </div>

          <div style={s.statsBar}>
            {(cfg.authority_stats || []).map((stat, i) => (
              <div key={i} style={s.statItem}>
                <p style={{ color: '#d4af37', fontSize: '2rem', fontWeight: 800, margin: 0 }}>{stat.value}</p>
                <p style={{ color: '#9ca3af', margin: '0.25rem 0 0 0', fontSize: '0.85rem' }}>{stat.label}</p>
              </div>
            ))}
          </div>

          <div style={s.anchorBadge} onClick={() => document.getElementById('section-cta')?.scrollIntoView({ behavior: 'smooth' })}>
            🛡️ PROTEJA SEU NEGOCIO
          </div>
        </div>
      </section>

      {/* ───── FOLD 7: CTA + REGISTRATION FORM ───── */}
      <section id="section-cta" ref={ctaRef} style={{ ...s.section, background: 'linear-gradient(180deg, #121212 0%, #0a0a0a 100%)' }}>
        <div style={s.container}>
          <div style={s.sectionBadge}>🛡️ PROTEJA SEU NEGOCIO</div>
          <h2 style={{ ...s.sectionTitle, marginBottom: '0.75rem' }}>{isPartnerContext ? `Regularize sua empresa agora com ${partnerName}` : cfg.cta_title}</h2>
          <p style={{ color: '#d1d5db', fontSize: '1.05rem', lineHeight: 1.7, maxWidth: '750px', margin: '0 auto 2rem auto', textAlign: 'center' }}>
            {isPartnerContext ? `Preencha o formulario abaixo e receba o diagnostico regulatorio gratuito do seu CNPJ. ${partnerName} acompanha todo o processo ate a entrega dos seus documentos.` : cfg.cta_body}
          </p>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <button onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth' })} style={{ ...s.ctaButton, background: primaryColor }}
              onMouseOver={(e) => { e.currentTarget.style.background = accentColor; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = primaryColor; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              🚀 {isPartnerContext ? `QUERO CONTINUAR COM ${partnerName.toUpperCase()}` : cfg.cta_button_text}
            </button>
            <p style={{ color: '#9ca3af', margin: '1rem 0 0 0', fontSize: '0.9rem' }}>
              🔒 {isPartnerContext ? 'Seus dados estao protegidos. Processo seguro, digital e sem burocracia.' : cfg.cta_sub_text}
            </p>
          </div>
          <div ref={formRef}>
            <RegistrationForm
              partnerBranding={partnerBranding}
              isPartnerContext={isPartnerContext}
              primaryColor={primaryColor}
              accentColor={accentColor}
              isSimulation={isSimulation}
            />
          </div>
        </div>
      </section>

      {/* ───── FOLD 8: FAQ ───── */}
      <section style={{ ...s.section, background: '#0c0c0c' }}>
        <div style={{ ...s.container, maxWidth: '720px' }}>
          <h2 style={s.sectionTitle}>{cfg.faq_title}</h2>
          <div style={{ marginTop: '2rem' }}>
            {(cfg.faq_items || []).map((item, i) => (
              <FAQItem key={i} question={item.question} answer={item.answer} />
            ))}
          </div>
        </div>
      </section>

      {/* ───── FOLD 9: FOOTER ───── */}
      <footer style={s.footer}>
        <div style={s.container}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <img src="/am-logo-branca.png" alt="AM Engenharia" style={{ height: '32px', width: 'auto', maxWidth: '140px', objectFit: 'contain' }} />
              <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                AM Engenharia © {new Date().getFullYear()}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <button onClick={() => navigateToApp('/cliente')} style={s.footerLink}>Acesso Cliente</button>
              {!isPartnerContext && <button onClick={() => navigateToApp('/parceiro')} style={s.footerLink}>Acesso Parceiro</button>}
              {!isPartnerContext && <button onClick={() => navigateToApp('/admin')} style={s.footerLink}>Acesso AM</button>}
            </div>
          </div>
          {isPartnerContext && (
            <div style={{ color: '#9ca3af', fontSize: '0.8rem', marginTop: '0.75rem', textAlign: 'center', lineHeight: 1.6 }}>
              Operacao e responsabilidade tecnica: <strong style={{ color: '#d4af37' }}>AM Engenharia</strong>. {partnerName} e parceiro comercial homologado.
            </div>
          )}
        </div>
      </footer>
    </div>
  );
};

// ─── Styles ───
const s = {
  page: {
    minHeight: '100vh', background: '#0a0a0a', color: '#f0f0f0',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  },
  header: {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
    background: 'rgba(10, 10, 10, 0.92)', backdropFilter: 'blur(12px)',
    borderBottom: '1px solid #222', padding: '0 2rem'
  },
  headerInner: {
    maxWidth: '1100px', margin: '0 auto',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    height: '64px', flexWrap: 'wrap', gap: '0.5rem'
  },
  headerCta: {
    padding: '0.5rem 1.25rem', borderRadius: '8px', border: 'none',
    background: '#d4af37', color: '#121212', fontWeight: 700, fontSize: '0.85rem',
    cursor: 'pointer', transition: 'all 0.2s'
  },
  headerBadge: {
    padding: '0.3rem 0.75rem', borderRadius: '6px', fontSize: '0.7rem',
    fontWeight: 700, letterSpacing: '0.5px', color: '#fbbf24',
    background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.25)'
  },
  nav: { display: 'flex', gap: '0.5rem', alignItems: 'center' },
  navLink: {
    background: 'none', border: '1px solid #333', borderRadius: '8px',
    color: '#d1d5db', padding: '0.4rem 0.75rem', fontSize: '0.8rem',
    cursor: 'pointer', transition: 'all 0.2s', fontWeight: 500
  },
  navLinkSubtle: {
    background: 'none', border: 'none', color: '#6b7280',
    padding: '0.4rem 0.5rem', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 500
  },
  hero: {
    paddingTop: '120px', paddingBottom: '60px',
    background: 'linear-gradient(180deg, #0a0a0a 0%, #121212 100%)',
    textAlign: 'center'
  },
  container: { maxWidth: '1100px', margin: '0 auto', padding: '0 1.5rem' },
  heroTitle: {
    fontSize: 'clamp(1.8rem, 4.5vw, 3rem)', fontWeight: 800, color: '#ffffff',
    margin: '0 0 1.25rem 0', lineHeight: 1.15, letterSpacing: '-0.02em'
  },
  heroSubtitle: {
    fontSize: '1.1rem', color: '#9ca3af', maxWidth: '700px', margin: '0 auto 2.5rem auto',
    lineHeight: 1.7
  },
  videoWrapper: {
    maxWidth: '740px', margin: '0 auto 2.5rem auto', aspectRatio: '16 / 9',
    borderRadius: '16px', overflow: 'hidden', border: '1px solid #333',
    background: '#111'
  },
  videoIframe: {
    width: '100%', height: '100%', border: 'none'
  },
  videoPlaceholder: {
    width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', background: '#111'
  },
  ctaButton: {
    padding: '1rem 2.5rem', borderRadius: '12px', border: 'none',
    background: '#d4af37', color: '#121212', fontWeight: 700, fontSize: '1.1rem',
    cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 20px rgba(212, 175, 55, 0.25)'
  },
  countdownRow: { textAlign: 'center', marginTop: '0' },
  countdownGrid: { display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' },
  countdownBox: {
    background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px',
    padding: '1rem 1.5rem', minWidth: '80px', textAlign: 'center'
  },
  countdownValue: {
    display: 'block', fontSize: '2rem', fontWeight: 800, color: '#d4af37',
    fontVariantNumeric: 'tabular-nums'
  },
  countdownLabel: {
    display: 'block', fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem',
    textTransform: 'uppercase', letterSpacing: '1px'
  },
  section: { padding: '5rem 0' },
  sectionBadge: {
    textAlign: 'center', display: 'block', color: '#d4af37', fontSize: '0.85rem',
    fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase',
    marginBottom: '1rem'
  },
  sectionTitle: {
    textAlign: 'center', fontSize: '2rem', fontWeight: 800, color: '#ffffff',
    margin: '0 0 0.75rem 0', letterSpacing: '-0.01em'
  },
  sectionSubtitle: {
    textAlign: 'center', color: '#9ca3af', fontSize: '1.05rem', maxWidth: '700px',
    margin: '0 auto 3rem auto', lineHeight: 1.6
  },
  cardGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '1.5rem'
  },
  card: {
    background: '#151515', border: '1px solid #2a2a2a', borderRadius: '16px',
    padding: '2rem', transition: 'border-color 0.2s'
  },
  solutionCard: {
    background: '#151515', border: '1px solid #2a2a2a', borderRadius: '16px',
    padding: '2rem'
  },
  partnerJourneyCard: {
    background: '#151515',
    border: '1px solid #2a2a2a',
    borderRadius: '16px',
    padding: '1.5rem',
    minHeight: '220px'
  },
  esocialCallout: {
    display: 'flex', alignItems: 'center', gap: '1rem', maxWidth: '700px',
    margin: '2.5rem auto 0 auto', padding: '1.25rem 1.5rem', borderRadius: '12px',
    background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.25)'
  },
  anchorBadge: {
    textAlign: 'center', marginTop: '3rem', color: '#6b7280', fontSize: '0.8rem',
    fontWeight: 600, letterSpacing: '1px', cursor: 'pointer', transition: 'color 0.2s',
    padding: '0.5rem'
  },
  mockupContainer: {
    flex: '1 1 340px', maxWidth: '420px', background: '#1a1a1a',
    border: '1px solid #333', borderRadius: '16px', overflow: 'hidden'
  },
  mockupPlaceholder: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: '4rem 2rem', textAlign: 'center'
  },
  featureItem: {
    display: 'flex', gap: '1rem', alignItems: 'flex-start'
  },
  featureCheck: {
    width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
    background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: '0.85rem', marginTop: '2px'
  },
  statsBar: {
    display: 'flex', justifyContent: 'center', gap: '3rem', flexWrap: 'wrap',
    padding: '2rem 0', borderTop: '1px solid #2a2a2a', borderBottom: '1px solid #2a2a2a'
  },
  statItem: { textAlign: 'center', minWidth: '160px' },
  footer: {
    padding: '2rem 0', borderTop: '1px solid #222', background: '#0a0a0a'
  },
  footerLink: {
    background: 'none', border: 'none', color: '#6b7280', fontSize: '0.85rem',
    cursor: 'pointer', padding: 0
  }
};

const PartnerIdentityCard = ({ title, value, subtitle, color }) => (
  <div style={{
    background: '#111827',
    border: '1px solid #334155',
    borderRadius: '14px',
    padding: '1rem 1.1rem',
    textAlign: 'left'
  }}>
    <div style={{ color: '#94a3b8', fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.45rem', fontWeight: 700 }}>{title}</div>
    <div style={{ color, fontSize: '1.05rem', fontWeight: 800, marginBottom: '0.35rem' }}>{value}</div>
    <div style={{ color: '#cbd5e1', fontSize: '0.88rem', lineHeight: 1.5 }}>{subtitle}</div>
  </div>
);

export default SalesLandingPage;
