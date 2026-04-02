
import React, { useState, useEffect } from 'react';
import { Anamnesis, User, BodyMeasurements, Occupation } from '../types';
import { formatPhone, formatCPF, formatName, calculateAge } from '../utils';
import { db, collection, onSnapshot, doc, setDoc, handleFirestoreError, OperationType, cleanObject } from '../firebase';

interface AnamnesisFormProps {
  user: User;
  onComplete?: (data: Anamnesis) => void;
  initialData?: Anamnesis;
  isAdminMode?: boolean;
}

const CheckboxField: React.FC<{ 
  label: string; 
  checked: boolean; 
  onChange: (val: boolean) => void;
  specValue?: string;
  onSpecChange?: (val: string) => void;
  specLabel?: string;
}> = ({ label, checked, onChange, specValue, onSpecChange, specLabel = "ESPECIFIQUE:" }) => (
  <div className="p-4 bg-white rounded-2xl border border-stone-100 shadow-sm transition-all hover:shadow-md">
    <div className="flex items-center justify-between mb-3">
      <span className="text-[10px] font-bold uppercase tracking-widest text-stone-600">{label}</span>
      <div className="flex gap-4">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="radio" checked={checked} onChange={() => onChange(true)} className="w-4 h-4 text-amber-600 focus:ring-amber-500" />
          <span className="text-[10px] font-bold text-stone-400">SIM</span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="radio" checked={!checked} onChange={() => onChange(false)} className="w-4 h-4 text-stone-300 focus:ring-amber-500" />
          <span className="text-[10px] font-bold text-stone-400">NÃO</span>
        </label>
      </div>
    </div>
    {onSpecChange && checked && (
      <div className="animate-fade-in">
        <label className="block text-[8px] font-bold text-amber-600 mb-1">{specLabel}</label>
        <input 
          className="w-full p-2 bg-stone-50 rounded-lg text-xs outline-none border border-transparent focus:border-amber-100" 
          value={specValue || ''} 
          onChange={e => onSpecChange(e.target.value)}
          placeholder="..."
        />
      </div>
    )}
  </div>
);

const AnamnesisForm: React.FC<AnamnesisFormProps> = ({ user, onComplete, initialData, isAdminMode }) => {
  const [occupations, setOccupations] = useState<Occupation[]>([]);
  const [isOtherOccupation, setIsOtherOccupation] = useState(false);
  const [customOccupation, setCustomOccupation] = useState('');
  const [showReview, setShowReview] = useState(false);
  const [signature, setSignature] = useState('');

  const initialMeasurements: BodyMeasurements = {
    bust: '', armL: '', armR: '', abdomen: '', waist: '', hip: '', 
    culotte: '', thighL: '', thighR: '', calfL: '', calfR: ''
  };

  const [formData, setFormData] = useState<Partial<Anamnesis>>({
    name: user.name,
    birthDate: user.birthDate || '',
    occupation: '',
    phone: user.phone || '',
    address: `${user.address?.street || ''}, ${user.address?.number || ''}`,
    rg: '',
    cpf: user.cpf || '',
    mainComplaint: '',
    skinType: 'mista',
    fitzpatrick: 'III',
    diabetes: false,
    epilepsy: false,
    intestinalRegular: true,
    treatmentAnterior: false,
    treatmentAnteriorSpec: '',
    waterIntake: true,
    waterIntakeSpec: '',
    alcohol: false,
    alcoholSpec: '',
    sunExposure: false,
    sunExposureFreq: '',
    menstruationPeriod: false,
    menstruationDate: '',
    sleepQuality: true,
    sleepHours: '',
    prosthesis: false,
    prosthesisSpec: '',
    smoking: false,
    cardiacAlterations: false,
    pacemaker: false,
    pregnant: false,
    pregnantWeeks: '',
    bodyCreams: false,
    bodyCreamsSpec: '',
    physicalActivity: false,
    physicalActivitySpec: '',
    contraceptive: false,
    contraceptiveSpec: '',
    allergy: false,
    allergySpec: '',
    nutrition: true,
    nutritionSpec: '',
    skinProblems: false,
    skinProblemsSpec: '',
    healingProblems: false,
    keloidHistory: false,
    metalImplants: false,
    metalImplantsSpec: '',
    acidUsage: false,
    acidUsageSpec: '',
    herpesHistory: false,
    oncologyHistory: false,
    measurements: initialMeasurements,
    height: '',
    initialWeight: '',
    finalWeight: '',
    observations: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    signatureAccepted: false
  });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'occupations'), (snapshot) => {
      setOccupations(snapshot.docs.map(doc => doc.data() as Occupation));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'occupations'));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({ ...initialData, signatureAccepted: true });
      setSignature(initialData.name); // Simple signature fallback
    }
  }, [initialData]);

  const handleOccupationChange = (val: string) => {
    if (val === 'outro') {
      setIsOtherOccupation(true);
      setFormData({ ...formData, occupation: '' });
    } else {
      setIsOtherOccupation(false);
      setFormData({ ...formData, occupation: val });
    }
  };

  const saveNewOccupation = async (name: string) => {
    const exists = occupations.find(o => o.name.toLowerCase() === name.toLowerCase());
    if (!exists && name.trim()) {
      const id = Date.now().toString();
      try {
        await setDoc(doc(db, 'occupations', id), cleanObject({ id, name }));
      } catch (error) {
        console.error("Error saving occupation:", error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!showReview && !isAdminMode) {
      setShowReview(true);
      window.scrollTo(0, 0);
      return;
    }

    if(!formData.signatureAccepted && !isAdminMode) {
      alert("Por favor, aceite o termo de responsabilidade para salvar a ficha.");
      return;
    }

    if (!signature.trim() && !isAdminMode) {
      alert("Por favor, assine o documento.");
      return;
    }

    let finalOccupation = formData.occupation;
    if (isOtherOccupation && customOccupation) {
      finalOccupation = customOccupation;
      await saveNewOccupation(customOccupation);
    }

    onComplete({
      ...formData,
      occupation: finalOccupation,
      filledAt: initialData?.filledAt || new Date().toLocaleString('pt-BR'),
    } as Anamnesis);
  };

  const updateMeasure = (key: keyof BodyMeasurements, val: string) => {
    setFormData({
      ...formData,
      measurements: { ...formData.measurements!, [key]: val }
    });
  };

  return (
    <div className={`max-w-5xl mx-auto bg-white p-6 md:p-12 rounded-[3.5rem] shadow-2xl border border-stone-100 animate-fade-in mb-16 ${isAdminMode ? 'border-amber-200' : ''}`}>
      <div className="text-center mb-12">
        <div className="inline-block p-4 bg-amber-50 rounded-full mb-4">
           <span className="text-3xl">📋</span>
        </div>
        <h2 className="text-4xl font-bold text-stone-800 mb-2 uppercase tracking-tighter">Prontuário de Estética Avançada</h2>
        <p className="text-stone-400 font-bold uppercase tracking-[0.3em] text-[10px]">
          {isAdminMode ? 'Gestão de Ficha Técnica' : 'Ficha de Avaliação Lumina'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-12">
        {showReview ? (
          <div className="space-y-8 animate-fade-in">
            <div className="bg-amber-50 p-8 rounded-[2.5rem] border border-amber-100">
              <h3 className="text-xl font-black uppercase tracking-tighter text-amber-800 mb-4">Revisão dos Dados</h3>
              <p className="text-sm text-amber-700 mb-6">Por favor, revise todas as informações antes de finalizar seu prontuário.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="flex justify-between border-b border-amber-100 pb-2">
                  <span className="font-bold text-stone-400 uppercase">Nome:</span>
                  <span className="font-black text-stone-800 uppercase">{formData.name}</span>
                </div>
                <div className="flex justify-between border-b border-amber-100 pb-2">
                  <span className="font-bold text-stone-400 uppercase">CPF:</span>
                  <span className="font-black text-stone-800 uppercase">{formData.cpf}</span>
                </div>
                <div className="flex justify-between border-b border-amber-100 pb-2">
                  <span className="font-bold text-stone-400 uppercase">Idade:</span>
                  <span className="font-black text-stone-800 uppercase">{calculateAge(formData.birthDate || '')} anos</span>
                </div>
                <div className="flex justify-between border-b border-amber-100 pb-2">
                  <span className="font-bold text-stone-400 uppercase">Telefone:</span>
                  <span className="font-black text-stone-800 uppercase">{formData.phone}</span>
                </div>
              </div>

              <button 
                type="button" 
                onClick={() => setShowReview(false)}
                className="mt-8 text-[10px] font-black uppercase tracking-widest text-amber-600 underline"
              >
                Voltar e Editar
              </button>
            </div>

            <div className="bg-stone-900 p-8 md:p-12 rounded-[2.5rem] text-white space-y-8">
              <h3 className="text-xl font-black uppercase tracking-tighter text-amber-500">Assinatura Digital</h3>
              <p className="text-xs text-stone-400 italic">Digite seu nome completo abaixo para assinar digitalmente este documento.</p>
              
              <input 
                required
                className="w-full p-6 bg-white/5 border border-white/10 rounded-3xl outline-none text-2xl font-serif italic text-amber-200 text-center"
                placeholder="Assine aqui..."
                value={signature}
                onChange={e => setSignature(e.target.value)}
              />

              <label className="flex items-center gap-4 cursor-pointer bg-white/5 p-6 rounded-3xl border border-white/5 hover:bg-white/10 transition-all">
                  <input 
                    type="checkbox" 
                    required 
                    className="w-6 h-6 rounded border-white/20 bg-transparent text-amber-500" 
                    checked={formData.signatureAccepted}
                    onChange={e => setFormData({...formData, signatureAccepted: e.target.checked})}
                  />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Confirmo a veracidade dos dados e assino este prontuário.</span>
              </label>

              <button type="submit" className="w-full py-6 bg-amber-600 hover:bg-amber-500 text-white rounded-3xl font-bold uppercase tracking-[0.3em] shadow-2xl active:scale-[0.98] transition-all">
                Finalizar e Salvar Prontuário
              </button>
            </div>
          </div>
        ) : (
          <>
        {/* IDENTIFICAÇÃO E QUEIXA */}
        <div className="space-y-6">
           <h3 className="text-xs font-bold uppercase tracking-widest text-amber-600 border-b border-amber-100 pb-2">Identificação do Paciente</h3>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <label className="text-[9px] font-bold uppercase text-stone-400 ml-2 mb-1 block">Nome Completo</label>
                <input required className="w-full p-4 bg-stone-50 rounded-2xl outline-none" value={formData.name || ''} onChange={e => setFormData({...formData, name: formatName(e.target.value)})} />
              </div>
              <div>
                <label className="text-[9px] font-bold uppercase text-stone-400 ml-2 mb-1 block">CPF</label>
                <input 
                  required 
                  className="w-full p-4 bg-stone-50 rounded-2xl outline-none" 
                  value={formData.cpf || ''} 
                  onChange={e => setFormData({...formData, cpf: formatCPF(e.target.value)})} 
                  maxLength={14}
                />
              </div>
              <div>
                <label className="text-[9px] font-bold uppercase text-stone-400 ml-2 mb-1 block">Data de Nasc. ({calculateAge(formData.birthDate || '')} anos)</label>
                <input type="date" required className="w-full p-4 bg-stone-50 rounded-2xl outline-none" value={formData.birthDate || ''} onChange={e => setFormData({...formData, birthDate: e.target.value})} />
              </div>
              <div>
                <label className="text-[9px] font-bold uppercase text-stone-400 ml-2 mb-1 block">Telefone</label>
                <input 
                  required 
                  className="w-full p-4 bg-stone-50 rounded-2xl outline-none" 
                  value={formData.phone || ''} 
                  onChange={e => setFormData({...formData, phone: formatPhone(e.target.value)})} 
                  maxLength={16}
                />
              </div>
              <div>
                <label className="text-[9px] font-bold uppercase text-stone-400 ml-2 mb-1 block">Ocupação</label>
                <div className="space-y-2">
                  <select 
                    className="w-full p-4 bg-stone-50 rounded-2xl outline-none text-xs font-bold uppercase"
                    value={isOtherOccupation ? 'outro' : (formData.occupation || '')}
                    onChange={e => handleOccupationChange(e.target.value)}
                  >
                    <option value="">Selecione...</option>
                    {occupations.map(o => (
                      <option key={o.id} value={o.name}>{o.name}</option>
                    ))}
                    <option value="outro">OUTRO (ESPECIFICAR)</option>
                  </select>
                  {isOtherOccupation && (
                    <input 
                      className="w-full p-4 bg-amber-50 border border-amber-100 rounded-2xl outline-none text-xs animate-fade-in" 
                      placeholder="Digite sua ocupação..."
                      value={customOccupation}
                      onChange={e => setCustomOccupation(e.target.value)}
                    />
                  )}
                </div>
              </div>
           </div>
           <div>
              <label className="text-[9px] font-bold uppercase text-amber-600 ml-2 mb-1 block">Queixa Principal / Ojetivo do Tratamento</label>
              <textarea required className="w-full p-4 bg-amber-50/30 border border-amber-100 rounded-2xl outline-none h-32" placeholder="O que mais incomoda ou o que deseja melhorar?" value={formData.mainComplaint || ''} onChange={e => setFormData({...formData, mainComplaint: e.target.value})} />
           </div>
        </div>

        {/* AVALIAÇÃO ESTÉTICA ESPECÍFICA */}
        <div className="space-y-6 pt-10 border-t border-stone-100">
          <h3 className="text-xs font-bold uppercase tracking-widest text-amber-600 border-b border-amber-100 pb-2">Avaliação Estética (Facial/Corporal)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div>
                <label className="text-[9px] font-bold uppercase text-stone-400 ml-2 mb-1 block">Tipo de Pele</label>
                <select className="w-full p-4 bg-stone-50 rounded-2xl outline-none font-bold text-stone-700 uppercase text-xs" value={formData.skinType || 'mista'} onChange={e => setFormData({...formData, skinType: e.target.value as any})}>
                   <option value="normal">Normal</option>
                   <option value="seca">Seca</option>
                   <option value="oleosa">Oleosa</option>
                   <option value="mista">Mista / Combinada</option>
                </select>
             </div>
             <div>
                <label className="text-[9px] font-bold uppercase text-stone-400 ml-2 mb-1 block">Fototipo (Escala de Fitzpatrick)</label>
                <select className="w-full p-4 bg-stone-50 rounded-2xl outline-none font-bold text-stone-700 text-xs" value={formData.fitzpatrick || 'III'} onChange={e => setFormData({...formData, fitzpatrick: e.target.value as any})}>
                   <option value="I">I - Branca (Sempre queima, nunca bronzeia)</option>
                   <option value="II">II - Branca (Queima fácil, bronzeia pouco)</option>
                   <option value="III">III - Morena Clara (Queima moderado, bronzeia moderado)</option>
                   <option value="IV">IV - Morena Moderada (Queima pouco, bronzeia fácil)</option>
                   <option value="V">V - Morena Escura (Queima raramente, bronzeia muito fácil)</option>
                   <option value="VI">VI - Negra (Nunca queima, bronzeia profundamente)</option>
                </select>
             </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <CheckboxField label="Uso de Ácidos na pele?" checked={formData.acidUsage!} onChange={v => setFormData({...formData, acidUsage: v})} onSpecChange={v => setFormData({...formData, acidUsageSpec: v})} specValue={formData.acidUsageSpec} />
            <CheckboxField label="Histórico de Herpes?" checked={formData.herpesHistory!} onChange={v => setFormData({...formData, herpesHistory: v})} />
            <CheckboxField label="Problemas de Cicatrização?" checked={formData.healingProblems!} onChange={v => setFormData({...formData, healingProblems: v})} />
            <CheckboxField label="Histórico de Quelóide?" checked={formData.keloidHistory!} onChange={v => setFormData({...formData, keloidHistory: v})} />
            <CheckboxField label="Implantes Metálicos / Pinos?" checked={formData.metalImplants!} onChange={v => setFormData({...formData, metalImplants: v})} onSpecChange={v => setFormData({...formData, metalImplantsSpec: v})} specValue={formData.metalImplantsSpec} />
            <CheckboxField label="Histórico Oncológico?" checked={formData.oncologyHistory!} onChange={v => setFormData({...formData, oncologyHistory: v})} />
          </div>
        </div>

        {/* HISTÓRICO MÉDICO GERAL */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 border-t border-stone-100 pt-10">
          <h3 className="col-span-full text-xs font-bold uppercase tracking-widest text-amber-600 border-b border-amber-100 pb-2 mb-2">Saúde e Estilo de Vida</h3>
          <CheckboxField label="Diabetes?" checked={formData.diabetes!} onChange={v => setFormData({...formData, diabetes: v})} />
          <CheckboxField label="Tabagismo?" checked={formData.smoking!} onChange={v => setFormData({...formData, smoking: v})} />
          <CheckboxField label="Epilepsia?" checked={formData.epilepsy!} onChange={v => setFormData({...formData, epilepsy: v})} />
          <CheckboxField label="Alterações Cardíacas?" checked={formData.cardiacAlterations!} onChange={v => setFormData({...formData, cardiacAlterations: v})} />
          <CheckboxField label="Marcapasso?" checked={formData.pacemaker!} onChange={v => setFormData({...formData, pacemaker: v})} />
          <CheckboxField 
            label="Gestante?" 
            checked={formData.pregnant!} 
            onChange={v => setFormData({...formData, pregnant: v})}
            onSpecChange={v => setFormData({...formData, pregnantWeeks: v})}
            specValue={formData.pregnantWeeks}
            specLabel="SEMANAS:"
          />
          <CheckboxField 
            label="Anticoncepcional?" 
            checked={formData.contraceptive!} 
            onChange={v => setFormData({...formData, contraceptive: v})}
            onSpecChange={v => setFormData({...formData, contraceptiveSpec: v})}
            specValue={formData.contraceptiveSpec}
            specLabel="QUAL?"
          />
          <CheckboxField 
            label="Alergias?" 
            checked={formData.allergy!} 
            onChange={v => setFormData({...formData, allergy: v})}
            onSpecChange={v => setFormData({...formData, allergySpec: v})}
            specValue={formData.allergySpec}
          />
          <CheckboxField 
            label="Tratamento anterior?" 
            checked={formData.treatmentAnterior!} 
            onChange={v => setFormData({...formData, treatmentAnterior: v})}
            onSpecChange={v => setFormData({...formData, treatmentAnteriorSpec: v})}
            specValue={formData.treatmentAnteriorSpec}
          />
          <CheckboxField label="Intestino Regular?" checked={formData.intestinalRegular!} onChange={v => setFormData({...formData, intestinalRegular: v})} />
          <CheckboxField label="Atividade Física?" checked={formData.physicalActivity!} onChange={v => setFormData({...formData, physicalActivity: v})} onSpecChange={v => setFormData({...formData, physicalActivitySpec: v})} specValue={formData.physicalActivitySpec} />
          <CheckboxField label="Boa Alimentação?" checked={formData.nutrition!} onChange={v => setFormData({...formData, nutrition: v})} />
        </div>

        {/* MEDIDAS ANTROPOMÉTRICAS */}
        <div className="border-t border-stone-100 pt-10">
          <h3 className="text-xs font-bold uppercase tracking-widest text-amber-600 border-b border-amber-100 pb-2 mb-8">Avaliação Física (Medidas)</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
             <div className="space-y-3 bg-stone-50 p-6 rounded-3xl border border-stone-100">
               {[
                 { id: 'bust', label: 'Busto' }, { id: 'armL', label: 'Braço E' }, { id: 'armR', label: 'Braço D' },
                 { id: 'abdomen', label: 'Abdômen' }, { id: 'waist', label: 'Cintura' }, { id: 'hip', label: 'Quadril' },
                 { id: 'culotte', label: 'Culote' }, { id: 'thighL', label: 'Coxa E' }, { id: 'thighR', label: 'Coxa D' },
                 { id: 'calfL', label: 'Panturrilha E' }, { id: 'calfR', label: 'Panturrilha D' }
               ].map((m) => (
                 <div key={m.id} className="flex items-center justify-between gap-4">
                    <span className="text-[10px] font-bold uppercase text-stone-500 min-w-[100px]">{m.label}</span>
                    <input 
                      className="flex-1 p-2 bg-white rounded-xl outline-none text-center font-bold text-stone-800 border border-stone-100" 
                      placeholder="cm"
                      value={formData.measurements?.[m.id as keyof BodyMeasurements] || ''}
                      onChange={e => updateMeasure(m.id as keyof BodyMeasurements, e.target.value)}
                    />
                 </div>
               ))}
             </div>
             <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <label className="text-[9px] font-bold uppercase text-stone-400 block mb-1">Altura (m)</label>
                     <input className="w-full p-4 bg-amber-50/50 rounded-2xl outline-none font-bold" value={formData.height || ''} onChange={e => setFormData({...formData, height: e.target.value})} placeholder="Ex: 1.65" />
                   </div>
                   <div>
                     <label className="text-[9px] font-bold uppercase text-stone-400 block mb-1">Peso Inicial (kg)</label>
                     <input className="w-full p-4 bg-amber-50/50 rounded-2xl outline-none font-bold" value={formData.initialWeight || ''} onChange={e => setFormData({...formData, initialWeight: e.target.value})} placeholder="Ex: 60" />
                   </div>
                   <div>
                     <label className="text-[9px] font-bold uppercase text-stone-400 block mb-1">Início Tratamento</label>
                     <input type="date" className="w-full p-4 bg-stone-50 rounded-2xl outline-none" value={formData.startDate || ''} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                   </div>
                   <div>
                     <label className="text-[9px] font-bold uppercase text-stone-400 block mb-1">Final Previsto</label>
                     <input type="date" className="w-full p-4 bg-stone-50 rounded-2xl outline-none" value={formData.endDate || ''} onChange={e => setFormData({...formData, endDate: e.target.value})} />
                   </div>
                </div>
                <div>
                   <label className="text-[9px] font-bold uppercase text-stone-400 block mb-1">Observações e Evolução do Caso</label>
                   <textarea className="w-full p-5 bg-stone-50 rounded-2xl outline-none h-40 text-sm italic" value={formData.observations || ''} onChange={e => setFormData({...formData, observations: e.target.value})} />
                </div>
             </div>
          </div>
        </div>

        {/* FINALIZAÇÃO */}
        <div className="bg-stone-900 p-8 md:p-12 rounded-[2.5rem] text-white space-y-8">
           <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <p className="text-[10px] md:text-xs font-medium text-stone-400 italic leading-relaxed text-center md:text-left">
                Declaro que as informações acima são verdadeiras. Autorizo a realização dos procedimentos estéticos acordados, ciente dos riscos e benefícios.
              </p>
              <div className="text-center md:text-right">
                <p className="text-[9px] font-bold uppercase tracking-widest text-amber-500 mb-1">Documento Gerado:</p>
                <p className="text-xl font-bold">{new Date().toLocaleDateString('pt-BR')}</p>
              </div>
           </div>

           <button type="submit" className="w-full py-6 bg-amber-600 hover:bg-amber-500 text-white rounded-3xl font-bold uppercase tracking-[0.3em] shadow-2xl active:scale-[0.98] transition-all">
              {isAdminMode ? 'Atualizar Prontuário Completo' : 'Revisar e Assinar Prontuário'}
           </button>
        </div>
        </>
        )}
      </form>
    </div>
  );
};

export default AnamnesisForm;
