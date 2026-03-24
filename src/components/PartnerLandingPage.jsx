import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../utils/supabase';
import { cleanDigits, formatCNPJ, maskCNPJ, maskPhone } from '../utils/formatters';
import PasswordRulesBox from './PasswordRulesBox';

const SST_APP_URL = import.meta.env.VITE_SST_APP_URL || 'https://sst.amengenhariaseg.com.br';

const PARTNER_NOTES_PREFIX = '__PARTNER_LEAD__';

const navigateToApp = (path) => {
  window.location.href = SST_APP_URL + path;
};

const notifyPartnerSignupThankYou = async ({ email, fullName, businessName }) => {
  const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/partner-signup-thank-you`;

  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY
    },
    body: JSON.stringify({ email, fullName, businessName })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || `HTTP ${response.status}`);
  }

  return payload;
};

const keepShortWordsTogether = (text) => {
  if (typeof text !== 'string') return text;
  return text.replace(/\b([AaEeOo])\s+(?=\S)/g, '$1\u00A0');
};

const buildPartnerLeadNotes = (data) => `${PARTNER_NOTES_PREFIX}${JSON.stringify(data)}`;

// Inline createAccessRequest - sem localStorage fallback
const createAccessRequest = async (payload) => {
  if (payload.cnpj) {
    const cleanCnpj = cleanDigits(payload.cnpj);
    const formattedCnpj = formatCNPJ(cleanCnpj);

    const { data: existing } = await supabase
      .from('access_requests')
      .select('id, status')
      .or(`cnpj.eq.${cleanCnpj},cnpj.eq.${formattedCnpj}`)
      .in('status', ['pending', 'approved'])
      .limit(1)
      .maybeSingle();

    if (existing) {
      const statusMsg = existing.status === 'pending' ? 'pendente de aprovacao' : 'ja aprovada';
      return { success: false, error: `Ja existe uma solicitacao ${statusMsg} para este CNPJ.` };
    }
  }

  const { data, error } = await supabase
    .from('access_requests')
    .insert(payload)
    .select('*')
    .maybeSingle();

  if (error) throw error;
  return { success: true, source: 'supabase', data };
};

const faqs = [
  {
    question: 'O parceiro recebe acesso imediato ao portal completo?',
    answer: 'Nao. Apos o cadastro, nosso time entra em contato para entender o perfil do seu escritorio e alinhar os proximos passos comerciais e operacionais.'
  },
  {
    question: 'A AM Engenharia entrega toda a operacao por tras da venda?',
    answer: 'Sim. A AM Engenharia estrutura a pagina de vendas, o sistema white label, a cobranca, o onboarding, os responsaveis tecnicos e toda a esteira operacional para o parceiro vender com a propria marca.'
  },
  {
    question: 'Como funciona a monetizacao do parceiro?',
    answer: 'A AM Engenharia define a base operacional. O parceiro pode trabalhar uma proposta acima desse valor. A diferenca compoe a margem comercial do parceiro, conforme a negociacao.'
  },
  {
    question: 'O escritorio vende com a propria marca?',
    answer: 'Sim. O modelo foi desenhado para o escritorio agregar valor para a carteira com uma operacao white label por tras, sem precisar montar estrutura tecnica propria para executar Seguranca do Trabalho.'
  }
];

const stepCards = [
  {
    eyebrow: '1. Cadastro',
    title: 'Seu escritorio deixa os dados e contexto comercial',
    text: 'Voce informa carteira, regiao e estagio comercial para o time da AM Engenharia entender o potencial de parceria.'
  },
  {
    eyebrow: '2. Contato',
    title: 'Nosso time entra em contato com voce',
    text: 'A AM Engenharia avalia o contexto enviado e chama seu escritorio para alinhar carteira, margem, posicionamento comercial e operacao white label.'
  },
  {
    eyebrow: '3. Estruturacao',
    title: 'Voce avanca com uma operacao comercial estruturada',
    text: 'Se houver aderencia, alinhamos discurso, margem, pagina de vendas, sistema white label e entrada operacional com a AM Engenharia.'
  }
];

const opportunityCards = [
  {
    title: 'Sua base ja esta sendo pressionada',
    text: 'NR-1, PGR, PCMSO e saude mental viraram assunto obrigatorio. Quem nao abre essa conversa agora perde carteira e relevancia.'
  },
  {
    title: 'Voce vende sem montar operacao tecnica',
    text: 'Nada de contratar equipe de Seguranca do Trabalho, correr atras de responsaveis tecnicos ou montar sistema proprio. A AM Engenharia segura toda a retaguarda operacional para sua marca vender forte.'
  },
  {
    title: 'Contador tem a vantagem que mais converte',
    text: 'Voce ja tem confianca, contexto e recorrencia com a base. Falta uma estrutura seria para transformar isso em receita sem improviso.'
  }
];

const roleCards = [
  {
    title: 'Papel do parceiro',
    items: [
      'Abrir relacionamento e identificar oportunidade na carteira',
      'Conduzir proposta comercial com apoio da AM Engenharia',
      'Definir sua margem sobre a base operacional da AM Engenharia'
    ]
  },
  {
    title: 'Papel da AM Engenharia',
    items: [
      'Estruturar pagina de vendas, sistema white label, cobranca e onboarding',
      'Executar entrega tecnica, documental, operacional e responsaveis tecnicos',
      'Sustentar processo, governanca e padronizacao para o parceiro vender com a propria marca'
    ]
  }
];

const monetizationCards = [
  {
    label: 'Base AM Engenharia',
    value: 'Preco operacional definido pela AM Engenharia',
    tone: '#d4af37'
  },
  {
    label: 'Preco final',
    value: 'Valor negociado pelo parceiro com o cliente na propria marca',
    tone: '#f8fafc'
  },
  {
    label: 'Sua margem',
    value: 'Diferenca entre base AM Engenharia e preco vendido',
    tone: '#22c55e'
  }
];

const initialForm = {
  contact_name: '',
  business_name: '',
  cnpj: '',
  email: '',
  phone: '',
  city: '',
  state: '',
  portfolio_size: '',
  main_niches: '',
  offers_sst: '',
  message: ''
};

const fieldStyle = {
  width: '100%',
  padding: '0.95rem 1rem',
  borderRadius: '12px',
  border: '1px solid #2a2a2a',
  background: '#0d0d0d',
  color: '#f8fafc',
  boxSizing: 'border-box',
  fontSize: '0.95rem'
};

const labelStyle = {
  display: 'block',
  color: '#9ca3af',
  fontSize: '0.78rem',
  fontWeight: 700,
  marginBottom: '0.4rem',
  textTransform: 'uppercase',
  letterSpacing: '0.08em'
};

const sectionTitleStyle = {
  fontSize: 'clamp(2rem, 4vw, 3rem)',
  fontWeight: 800,
  color: '#f8fafc',
  margin: '0 0 1rem 0',
  lineHeight: 1.1
};

const sectionSubtitleStyle = {
  color: '#cbd5e1',
  fontSize: '1rem',
  lineHeight: 1.7,
  maxWidth: '760px',
  margin: 0
};

function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ borderBottom: '1px solid #262626' }}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        style={{
          width: '100%',
          background: 'none',
          border: 'none',
          color: '#f8fafc',
          padding: '1.15rem 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          textAlign: 'left',
          gap: '1rem',
          fontSize: '1rem',
          fontWeight: 700
        }}
      >
        <span>{keepShortWordsTogether(question)}</span>
        <span style={{ color: '#d4af37', fontSize: '1.3rem', lineHeight: 1 }}>{open ? '-' : '+'}</span>
      </button>
      {open && <p style={{ color: '#9ca3af', margin: '0 0 1.15rem 0', lineHeight: 1.7 }}>{keepShortWordsTogether(answer)}</p>}
    </div>
  );
}

const PartnerLandingPage = () => {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [submittedName, setSubmittedName] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [submittedBusinessName, setSubmittedBusinessName] = useState('');
  const [submittedFullName, setSubmittedFullName] = useState('');
  const [submittedCnpj, setSubmittedCnpj] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1280));

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handleResize = () => setViewportWidth(window.innerWidth);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const canSubmit = useMemo(() => !loading, [loading]);

  const isTablet = viewportWidth < 1080;
  const isMobile = viewportWidth < 768;
  const isNarrowMobile = viewportWidth < 560;

  const sectionPadding = isMobile ? '3.25rem 1rem' : '4rem 1.5rem';
  const heroSectionPadding = isMobile ? '3.5rem 1rem 3rem' : '5rem 1.5rem 4rem';
  const heroGridStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: isTablet ? 'minmax(0, 1fr)' : 'minmax(0, 1.15fr) minmax(320px, 0.85fr)',
    gap: isMobile ? '1.5rem' : '2rem',
    alignItems: 'start'
  };
  const pairedFieldGridStyle = {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
    gap: '0.9rem'
  };
  const cityUfGridStyle = {
    display: 'grid',
    gridTemplateColumns: isNarrowMobile ? '1fr' : isMobile ? 'minmax(0, 1fr) 110px' : '1fr 120px',
    gap: '0.9rem'
  };
  const bottomCtaStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '1.2rem',
    alignItems: 'center',
    flexWrap: 'wrap',
    flexDirection: isMobile ? 'column' : 'row'
  };

  const scrollToForm = () => {
    const formElement = document.getElementById('partner-interest-form');
    formElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const cnpj = cleanDigits(form.cnpj);
    const phone = cleanDigits(form.phone);
    const state = String(form.state || '').trim().toUpperCase();

    if (!form.contact_name.trim()) { setMessage({ type: 'error', text: 'Informe o nome completo do responsavel.' }); return; }
    if (!form.business_name.trim()) { setMessage({ type: 'error', text: 'Informe o nome do escritorio ou empresa.' }); return; }
    if (cnpj.length !== 14) { setMessage({ type: 'error', text: 'Informe um CNPJ valido com 14 digitos.' }); return; }
    if (!form.email.trim() || !form.email.includes('@')) { setMessage({ type: 'error', text: 'Informe um E-mail valido.' }); return; }
    if (phone.length < 10) { setMessage({ type: 'error', text: 'Informe um WhatsApp com DDD.' }); return; }
    if (!form.city.trim()) { setMessage({ type: 'error', text: 'Informe a cidade.' }); return; }
    if (state.length !== 2) { setMessage({ type: 'error', text: 'Informe a UF com 2 letras.' }); return; }
    if (!form.portfolio_size.trim()) { setMessage({ type: 'error', text: 'Informe o numero aproximado de clientes na carteira.' }); return; }
    if (!form.main_niches.trim()) { setMessage({ type: 'error', text: 'Informe os nichos em que seu escritorio tem mais clientes.' }); return; }
    if (!form.offers_sst) { setMessage({ type: 'error', text: 'Informe se voce ja oferece Seguranca do Trabalho hoje.' }); return; }

    setLoading(true);
    setMessage(null);

    try {
      const notes = buildPartnerLeadNotes({
        origin: 'landing_contadores',
        channel: 'contadores',
        segment: 'contador',
        destination_queue: 'access_requests.partner.pending',
        destination_view: 'revisao_parceiros',
        city: form.city.trim(),
        state,
        portfolio_size: form.portfolio_size.trim(),
        client_count: form.portfolio_size.trim(),
        main_niches: form.main_niches.trim(),
        offers_sst: form.offers_sst,
        message: form.message.trim()
      });

      const result = await createAccessRequest({
        request_type: 'partner',
        status: 'pending',
        contact_name: form.contact_name.trim(),
        business_name: form.business_name.trim(),
        cnpj,
        email: form.email.trim(),
        phone,
        notes
      });

      if (!result.success || result.source !== 'supabase') {
        setMessage({ type: 'error', text: result.error || 'Nao foi possivel enviar sua solicitacao agora.' });
        return;
      }

      try {
        await notifyPartnerSignupThankYou({
          email: form.email.trim().toLowerCase(),
          fullName: form.contact_name.trim(),
          businessName: form.business_name.trim()
        });
      } catch (emailError) {
        console.error('Erro ao enviar E-mail pos-cadastro do parceiro:', emailError);
      }

      setSubmittedName(form.contact_name.trim().split(' ')[0]);
      setSubmittedEmail(form.email.trim().toLowerCase());
      setSubmittedBusinessName(form.business_name.trim());
      setSubmittedFullName(form.contact_name.trim());
      setSubmittedCnpj(form.cnpj.replace(/\D/g, ''));
      setForm(initialForm);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Erro ao enviar solicitacao de parceiro:', error);
      setMessage({ type: 'error', text: 'Falha ao enviar solicitacao. Tente novamente em instantes.' });
    } finally {
      setLoading(false);
    }
  };

  const headerBlock = (
    <header style={{ position: 'sticky', top: 0, zIndex: 20, backdropFilter: 'blur(12px)', background: 'rgba(9, 9, 9, 0.88)', borderBottom: '1px solid #1f1f1f' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
          <img src="/am-logo-branca.png" alt="AM Engenharia" style={{ height: '42px', width: 'auto' }} />
          <span style={{ color: '#d4af37', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.12em' }}>CANAL CONTABIL</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
          {!submitted && (
            <button onClick={scrollToForm} style={{ padding: '0.85rem 1.1rem', borderRadius: '999px', border: 'none', background: '#d4af37', color: '#111827', fontWeight: 800, cursor: 'pointer' }}>
              Quero me credenciar
            </button>
          )}
          <button onClick={() => navigateToApp('/parceiro')} style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer' }}>
            Ja sou parceiro
          </button>
          <button onClick={() => navigateToApp('/cliente')} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
            Sou cliente
          </button>
        </div>
      </div>
    </header>
  );

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    if (!password || password.length < 10) {
      setMessage({ type: 'error', text: 'A senha deve ter no minimo 10 caracteres.' });
      return;
    }
    if (!/[a-z]/.test(password)) { setMessage({ type: 'error', text: 'A senha deve incluir ao menos uma letra minuscula.' }); return; }
    if (!/[A-Z]/.test(password)) { setMessage({ type: 'error', text: 'A senha deve incluir ao menos uma letra maiuscula.' }); return; }
    if (!/\d/.test(password)) { setMessage({ type: 'error', text: 'A senha deve incluir ao menos um numero.' }); return; }
    if (!/[^A-Za-z0-9]/.test(password)) { setMessage({ type: 'error', text: 'A senha deve incluir ao menos um caractere especial.' }); return; }
    if (password !== passwordConfirm) {
      setMessage({ type: 'error', text: 'As senhas nao coincidem.' });
      return;
    }
    setCreatingAccount(true);
    setMessage(null);
    try {
      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-partner-account`;
      const res = await fetch(functionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: import.meta.env.VITE_SUPABASE_ANON_KEY },
        body: JSON.stringify({ email: submittedEmail, password, fullName: submittedFullName, businessName: submittedBusinessName, cnpj: submittedCnpj })
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: 'error', text: payload?.error || `Erro ao criar conta (HTTP ${res.status}).` });
        return;
      }
      setAccountCreated(true);
      setTimeout(() => navigateToApp('/parceiro'), 3000);
    } catch (err) {
      console.error('Erro ao criar conta de parceiro:', err);
      setMessage({ type: 'error', text: 'Falha de conexao. Tente novamente.' });
    } finally {
      setCreatingAccount(false);
    }
  };

  if (submitted) {
    if (accountCreated) {
      return (
        <div style={{ minHeight: '100vh', background: '#090909', color: '#f8fafc' }}>
          {headerBlock}
          <section style={{ padding: isMobile ? '4rem 1rem' : '6rem 1.5rem', background: 'radial-gradient(circle at top left, rgba(34,197,94,0.18), transparent 28%), linear-gradient(180deg, #090909 0%, #121212 100%)' }}>
            <div style={{ maxWidth: '520px', margin: '0 auto', textAlign: 'center' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>✅</div>
              <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', lineHeight: 1.1, margin: '0 0 1rem 0', fontWeight: 900 }}>Conta criada com sucesso!</h1>
              <p style={{ fontSize: '1.1rem', color: '#d1d5db', lineHeight: 1.8, margin: '0 0 1.5rem' }}>
                {keepShortWordsTogether('Voce recebera um E-mail de boas-vindas com os proximos passos. Redirecionando para o login...')}
              </p>
              <button onClick={() => navigateToApp('/parceiro')} style={{ padding: '1rem 1.5rem', borderRadius: '14px', border: 'none', background: '#d4af37', color: '#111827', fontWeight: 900, cursor: 'pointer', fontSize: '1rem' }}>
                Ir para login agora
              </button>
            </div>
          </section>
        </div>
      );
    }

    return (
      <div style={{ minHeight: '100vh', background: '#090909', color: '#f8fafc' }}>
        {headerBlock}

        <section style={{ padding: isMobile ? '4rem 1rem' : '6rem 1.5rem', background: 'radial-gradient(circle at top left, rgba(212,175,55,0.18), transparent 28%), linear-gradient(180deg, #090909 0%, #121212 100%)' }}>
          <div style={{ maxWidth: '520px', margin: '0 auto', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', padding: '0.55rem 1rem', borderRadius: '999px', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', color: '#86efac', fontSize: '0.82rem', fontWeight: 800, letterSpacing: '0.08em', marginBottom: '1.5rem' }}>
              CADASTRO RECEBIDO COM SUCESSO
            </div>

            <h1 style={{ fontSize: 'clamp(2rem, 4.5vw, 3.2rem)', lineHeight: 1.05, margin: '0 0 0.75rem 0', fontWeight: 900, letterSpacing: '-0.03em' }}>
              {submittedName ? `Obrigado, ${submittedName}.` : 'Obrigado pelo cadastro.'}
            </h1>

            <p style={{ fontSize: '1.05rem', color: '#d1d5db', lineHeight: 1.7, margin: '0 auto 2rem', maxWidth: '480px' }}>
              {keepShortWordsTogether('Agora crie sua senha para acessar a area de parceiro.')}
            </p>

            <div style={{ background: '#141414', border: '1px solid #262626', borderRadius: '24px', padding: isMobile ? '1.5rem' : '2rem', textAlign: 'left' }}>
              <h3 style={{ margin: '0 0 1.2rem 0', color: '#f8fafc', fontSize: '1.15rem', fontWeight: 800 }}>Defina sua senha de acesso</h3>

              {message && (
                <div style={{ marginBottom: '1rem', padding: '0.85rem 1rem', borderRadius: '14px', border: `1px solid ${message.type === 'success' ? '#14532d' : '#7f1d1d'}`, background: message.type === 'success' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', color: message.type === 'success' ? '#86efac' : '#fca5a5', lineHeight: 1.6 }}>
                  {message.text}
                </div>
              )}

              <form onSubmit={handleCreateAccount} style={{ display: 'grid', gap: '0.95rem' }}>
                <Field label="E-mail">
                  <input value={submittedEmail} disabled style={{ ...fieldStyle, opacity: 0.6, cursor: 'not-allowed' }} />
                </Field>

                <Field label="Senha" required>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={fieldStyle} placeholder="Minimo 10 caracteres" minLength={10} />
                  <PasswordRulesBox password={password} />
                </Field>

                <Field label="Confirmar senha" required>
                  <input type="password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} style={fieldStyle} placeholder="Repita a senha" />
                </Field>

                <button type="submit" disabled={creatingAccount} style={{ marginTop: '0.35rem', padding: '1rem 1.2rem', borderRadius: '14px', border: 'none', background: creatingAccount ? '#4b5563' : '#d4af37', color: creatingAccount ? '#d1d5db' : '#111827', fontWeight: 900, cursor: creatingAccount ? 'not-allowed' : 'pointer', fontSize: '0.95rem' }}>
                  {creatingAccount ? 'Criando conta...' : 'CRIAR MINHA CONTA DE PARCEIRO'}
                </button>
              </form>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#090909', color: '#f8fafc' }}>
      {headerBlock}

      <section style={{ padding: heroSectionPadding, background: 'radial-gradient(circle at top left, rgba(212,175,55,0.18), transparent 28%), linear-gradient(180deg, #090909 0%, #121212 100%)' }}>
        <div style={heroGridStyle}>
          <div>
            <div style={{ display: 'inline-flex', padding: '0.45rem 0.8rem', borderRadius: '999px', background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)', color: '#f7d978', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '1.25rem', maxWidth: '100%', whiteSpace: 'normal' }}>
              ESCRITORIOS CONTABEIS QUE QUEREM FATURAR COM SEGURANCA DO TRABALHO
            </div>
            <h1 style={{ fontSize: 'clamp(2.6rem, 6vw, 5rem)', lineHeight: 0.95, margin: '0 0 1rem 0', fontWeight: 900, letterSpacing: '-0.04em' }}>
                {keepShortWordsTogether('Seus clientes ja precisam. A pergunta que fica e se eles vao comprar de voce ou do seu concorrente?')}
            </h1>
            <p style={{ fontSize: '1.08rem', color: '#d1d5db', lineHeight: 1.8, maxWidth: '760px', margin: '0 0 1.5rem 0' }}>
              {keepShortWordsTogether('A AM Engenharia entrega toda a operacao por tras da venda: pagina de vendas, sistema white label, cobranca, onboarding, responsaveis tecnicos e execucao. Seu escritorio vende com a propria marca, agrega mais valor para a carteira e amplia margem sem montar estrutura interna.')}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
              <MetricCard value="Base contabil" label="vira canal de venda com mais ticket" />
              <MetricCard value="White label" label="pagina, sistema e operacao prontos para sua marca" />
              <MetricCard value="Sua margem" label="diferenca entre base AM Engenharia e preco vendido pelo seu escritorio" />
            </div>
            <div style={{ display: 'flex', gap: '0.9rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <button onClick={scrollToForm} style={{ padding: '1rem 1.35rem', borderRadius: '14px', border: 'none', background: '#d4af37', color: '#111827', fontWeight: 900, cursor: 'pointer', fontSize: '0.96rem' }}>
                QUERO CADASTRAR MEU ESCRITORIO
              </button>
              <span style={{ color: '#9ca3af', fontSize: '0.92rem' }}>
                {keepShortWordsTogether('Cadastro simples e contato direto do time da AM Engenharia.')}
              </span>
            </div>
          </div>

          <div id="partner-interest-form" style={{ background: '#141414', border: '1px solid #262626', borderRadius: '24px', padding: isMobile ? '1.1rem' : '1.5rem', boxShadow: '0 30px 70px rgba(0,0,0,0.35)' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#22c55e', fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.08em', marginBottom: '0.55rem' }}>CADASTRO DE INTERESSE</div>
                <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#f8fafc' }}>{keepShortWordsTogether('Cadastre seu escritorio agora e fature com algo que seus clientes terao que comprar.')}</h2>
              <p style={{ margin: '0.7rem 0 0 0', color: '#9ca3af', lineHeight: 1.6 }}>
                {keepShortWordsTogether('Preencha os dados abaixo. Nosso time vai analisar o contexto do seu escritorio e entrar em contato.')}
              </p>
            </div>

            {message && (
              <div style={{ marginBottom: '1rem', padding: '0.95rem 1rem', borderRadius: '14px', border: `1px solid ${message.type === 'success' ? '#14532d' : '#7f1d1d'}`, background: message.type === 'success' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', color: message.type === 'success' ? '#86efac' : '#fca5a5', lineHeight: 1.6 }}>
                {keepShortWordsTogether(message.text)}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.95rem' }}>
              <Field label="Nome completo" required>
                <input value={form.contact_name} onChange={(e) => handleChange('contact_name', e.target.value)} style={fieldStyle} placeholder="Responsavel pelo contato" />
              </Field>

              <Field label="Nome do escritorio" required>
                <input value={form.business_name} onChange={(e) => handleChange('business_name', e.target.value)} style={fieldStyle} placeholder="Nome do escritorio ou empresa" />
              </Field>

              <div style={pairedFieldGridStyle}>
                <Field label="CNPJ" required>
                  <input value={form.cnpj} onChange={(e) => handleChange('cnpj', maskCNPJ(e.target.value))} style={fieldStyle} placeholder="00.000.000/0000-00" />
                </Field>
                <Field label="E-mail" required>
                  <input type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} style={fieldStyle} placeholder="contato@escritorio.com.br" />
                </Field>
              </div>

              <div style={pairedFieldGridStyle}>
                <Field label="WhatsApp" required>
                  <input value={form.phone} onChange={(e) => handleChange('phone', maskPhone(e.target.value))} style={fieldStyle} placeholder="(00) 00000-0000" />
                </Field>
                <Field label="Clientes na carteira" required>
                  <input value={form.portfolio_size} onChange={(e) => handleChange('portfolio_size', e.target.value)} style={fieldStyle} placeholder="Ex.: 80, 150, 300+" />
                </Field>
              </div>

              <Field label="Nichos com mais clientes" required>
                <input value={form.main_niches} onChange={(e) => handleChange('main_niches', e.target.value)} style={fieldStyle} placeholder="Ex.: comercio, clinicas, industrias, transportadoras" />
              </Field>

              <div style={cityUfGridStyle}>
                <Field label="Cidade" required>
                  <input value={form.city} onChange={(e) => handleChange('city', e.target.value)} style={fieldStyle} placeholder="Sua cidade" />
                </Field>
                <Field label="UF" required>
                  <input value={form.state} onChange={(e) => handleChange('state', e.target.value.toUpperCase().slice(0, 2))} style={fieldStyle} placeholder="SP" maxLength={2} />
                </Field>
              </div>

              <Field label="Ja oferece Seguranca do Trabalho?" required>
                <select value={form.offers_sst} onChange={(e) => handleChange('offers_sst', e.target.value)} style={fieldStyle}>
                  <option value="">Selecione</option>
                  <option value="sim">Sim</option>
                  <option value="nao">Nao</option>
                </select>
              </Field>

              <Field label="Mensagem opcional">
                <textarea value={form.message} onChange={(e) => handleChange('message', e.target.value)} style={{ ...fieldStyle, resize: 'vertical', minHeight: '110px' }} placeholder="Conte rapidamente ticket medio, perfil da carteira, regioes atendidas ou o que voce quer estruturar com a AM Engenharia." />
              </Field>

              <button type="submit" disabled={!canSubmit} style={{ marginTop: '0.35rem', padding: '1rem 1.2rem', borderRadius: '14px', border: 'none', background: loading ? '#4b5563' : '#d4af37', color: loading ? '#d1d5db' : '#111827', fontWeight: 900, cursor: loading ? 'not-allowed' : 'pointer', fontSize: '0.95rem' }}>
                {loading ? 'Enviando...' : 'QUERO RECEBER CONTATO DA AM ENGENHARIA'}
              </button>
            </form>
          </div>
        </div>
      </section>

      <section style={{ padding: sectionPadding, background: '#0f0f0f' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ color: '#d4af37', fontSize: '0.8rem', letterSpacing: '0.12em', fontWeight: 800, marginBottom: '0.8rem' }}>OPORTUNIDADE E URGENCIA</div>
            <h2 style={sectionTitleStyle}>{keepShortWordsTogether('Sua carteira esta virando receita para alguem. A questao e se esse alguem sera o seu escritorio.')}</h2>
            <p style={sectionSubtitleStyle}>{keepShortWordsTogether('Empresa com colaborador vai precisar conversar sobre Seguranca do Trabalho. Quem nao lidera essa pauta perde posicao consultiva e ainda deixa margem escapar.')}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            {opportunityCards.map((card) => (
              <div key={card.title} style={{ background: '#171717', border: '1px solid #292929', borderRadius: '20px', padding: '1.5rem' }}>
                <h3 style={{ margin: '0 0 0.7rem 0', color: '#f8fafc', fontSize: '1.1rem' }}>{keepShortWordsTogether(card.title)}</h3>
                <p style={{ margin: 0, color: '#9ca3af', lineHeight: 1.7 }}>{keepShortWordsTogether(card.text)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: sectionPadding, background: '#090909' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ color: '#d4af37', fontSize: '0.8rem', letterSpacing: '0.12em', fontWeight: 800, marginBottom: '0.8rem' }}>COMO FUNCIONA</div>
            <h2 style={sectionTitleStyle}>{keepShortWordsTogether('Fluxo objetivo: cadastro, contato e estruturacao comercial.')}</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            {stepCards.map((card) => (
              <div key={card.title} style={{ background: 'linear-gradient(180deg, #141414 0%, #111111 100%)', border: '1px solid #242424', borderRadius: '22px', padding: '1.6rem' }}>
                <div style={{ color: '#f7d978', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.08em', marginBottom: '0.7rem' }}>{card.eyebrow}</div>
                <h3 style={{ margin: '0 0 0.65rem 0', color: '#f8fafc', fontSize: '1.15rem' }}>{keepShortWordsTogether(card.title)}</h3>
                <p style={{ margin: 0, color: '#9ca3af', lineHeight: 1.7 }}>{keepShortWordsTogether(card.text)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: sectionPadding, background: '#101010' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ color: '#d4af37', fontSize: '0.8rem', letterSpacing: '0.12em', fontWeight: 800, marginBottom: '0.8rem' }}>DIVISAO DE PAPEIS</div>
            <h2 style={sectionTitleStyle}>{keepShortWordsTogether('Voce vende. A AM Engenharia entrega. O cliente sente seguranca dos dois lados.')}</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {roleCards.map((card, index) => (
              <div key={card.title} style={{ background: index === 0 ? '#171717' : '#14181a', border: `1px solid ${index === 0 ? '#2e2e2e' : '#1f3a45'}`, borderRadius: '22px', padding: '1.7rem' }}>
                <h3 style={{ margin: '0 0 1rem 0', color: '#f8fafc', fontSize: '1.2rem' }}>{keepShortWordsTogether(card.title)}</h3>
                <div style={{ display: 'grid', gap: '0.8rem' }}>
                  {card.items.map((item) => (
                    <div key={item} style={{ display: 'flex', gap: '0.7rem', alignItems: 'flex-start' }}>
                      <span style={{ color: index === 0 ? '#d4af37' : '#22c55e', fontWeight: 800 }}>•</span>
                      <span style={{ color: '#cbd5e1', lineHeight: 1.7 }}>{keepShortWordsTogether(item)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: sectionPadding, background: 'linear-gradient(180deg, #0b0b0b 0%, #121212 100%)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ color: '#d4af37', fontSize: '0.8rem', letterSpacing: '0.12em', fontWeight: 800, marginBottom: '0.8rem' }}>MARGEM E MODELO COMERCIAL</div>
            <h2 style={sectionTitleStyle}>{keepShortWordsTogether('O ganho esta na sua margem, nao em promessas vagas de parceria.')}</h2>
            <p style={sectionSubtitleStyle}>{keepShortWordsTogether('A AM Engenharia define a base operacional. Seu escritorio vende acima disso e captura a diferenca como margem comercial, com checkout e entrega sob controle da AM Engenharia.')}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {monetizationCards.map((card) => (
              <div key={card.label} style={{ background: '#151515', border: '1px solid #2a2a2a', borderRadius: '20px', padding: '1.5rem' }}>
                <div style={{ color: card.tone, fontSize: '0.82rem', fontWeight: 800, letterSpacing: '0.08em', marginBottom: '0.65rem' }}>{keepShortWordsTogether(card.label)}</div>
                <div style={{ color: '#f8fafc', fontSize: '1.08rem', lineHeight: 1.5, fontWeight: 700 }}>{keepShortWordsTogether(card.value)}</div>
              </div>
            ))}
          </div>
          <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.22)', borderRadius: '20px', padding: '1.35rem 1.5rem', color: '#d1fae5', lineHeight: 1.8 }}>
            {keepShortWordsTogether('A operacao pode rodar com a marca do seu escritorio na frente, enquanto a AM Engenharia sustenta a retaguarda tecnica, documental e operacional para a entrega acontecer com consistencia.')}
          </div>
        </div>
      </section>

      <section style={{ padding: sectionPadding, background: '#0c0c0c' }}>
        <div style={{ maxWidth: '780px', margin: '0 auto' }}>
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ color: '#d4af37', fontSize: '0.8rem', letterSpacing: '0.12em', fontWeight: 800, marginBottom: '0.8rem' }}>PERGUNTAS FREQUENTES</div>
            <h2 style={sectionTitleStyle}>{keepShortWordsTogether('White label de verdade, com operacao seria por tras da sua marca.')}</h2>
          </div>
          {faqs.map((item) => (
            <FAQItem key={item.question} question={item.question} answer={item.answer} />
          ))}
        </div>
      </section>

      <section style={{ padding: isMobile ? '3rem 1rem 3.5rem' : '3.5rem 1.5rem 4.5rem', background: '#090909' }}>
        <div style={{ maxWidth: '980px', margin: '0 auto', background: 'linear-gradient(135deg, rgba(212,175,55,0.12), rgba(34,197,94,0.08))', border: '1px solid rgba(212,175,55,0.22)', borderRadius: '28px', padding: '2rem' }}>
          <div style={bottomCtaStyle}>
            <div>
              <div style={{ color: '#f7d978', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.1em', marginBottom: '0.6rem' }}>PROXIMO PASSO</div>
                <h2 style={{ margin: '0 0 0.7rem 0', color: '#f8fafc', fontSize: 'clamp(1.7rem, 4vw, 2.4rem)' }}>{keepShortWordsTogether('Se voce quer vender Seguranca do Trabalho pela sua carteira, cadastre seu escritorio e fale com a AM Engenharia.')}</h2>
                <p style={{ margin: 0, color: '#cbd5e1', lineHeight: 1.7 }}>{keepShortWordsTogether('Nosso time analisa o seu contexto, entra em contato e avalia junto com voce o melhor formato para avancar comercialmente.')}</p>
            </div>
            <button onClick={scrollToForm} style={{ padding: '1rem 1.35rem', borderRadius: '14px', border: 'none', background: '#d4af37', color: '#111827', fontWeight: 900, cursor: 'pointer', whiteSpace: isMobile ? 'normal' : 'nowrap', width: isMobile ? '100%' : 'auto' }}>
                CADASTRAR MEU ESCRITORIO
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

const MetricCard = ({ value, label }) => (
  <div style={{ background: '#141414', border: '1px solid #262626', borderRadius: '18px', padding: '1rem 1.1rem' }}>
    <div style={{ color: '#f8fafc', fontSize: '1rem', fontWeight: 800, marginBottom: '0.35rem' }}>{keepShortWordsTogether(value)}</div>
    <div style={{ color: '#9ca3af', fontSize: '0.88rem', lineHeight: 1.5 }}>{keepShortWordsTogether(label)}</div>
  </div>
);

const Field = ({ label, required = false, children }) => (
  <label style={{ display: 'block' }}>
    <span style={labelStyle}>
      {keepShortWordsTogether(label)}{required ? ' *' : ''}
    </span>
    {children}
  </label>
);

export default PartnerLandingPage;
