
import React, { useState } from 'react';
import { EnergyCalculationLead } from '../types';

type Step = 1 | 2 | 3 | 4;

const EnergyCalculator: React.FC<{ onNavigate?: (view: any) => void }> = ({ onNavigate }) => {
  const [step, setStep] = useState<Step>(1);
  const [conditioning, setConditioning] = useState<string>('');
  const [gender, setGender] = useState<'male' | 'female'>('female');
  const [age, setAge] = useState<number | string>('');
  const [weight, setWeight] = useState<number | string>('');
  const [height, setHeight] = useState<number | string>('');
  const [activityFactor, setActivityFactor] = useState<number>(1.2);

  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [isLeadSent, setIsLeadSent] = useState(false);

  const [results, setResults] = useState<{
    tdee: number;
    bmr: number;
    protein: number;
    weightLoss: number;
    hypertrophy: number;
    maintenance: number;
  } | null>(null);

  const handleCalculate = () => {
    if (!age || !weight || !height) return;

    const a = Number(age);
    const w = Number(weight);
    const h = Number(height);

    // Mifflin-St Jeor Equation
    let bmr = 0;
    if (gender === 'male') {
      bmr = (10 * w) + (6.25 * h) - (5 * a) + 5;
    } else {
      bmr = (10 * w) + (6.25 * h) - (5 * a) - 161;
    }

    const tdee = bmr * activityFactor;
    
    setResults({
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      protein: Math.round(w * 2), // Sugestão base: 2g por kg
      weightLoss: Math.round(tdee - 500),
      hypertrophy: Math.round(tdee + 400),
      maintenance: Math.round(tdee)
    });
    setStep(4);
  };

  const handleSendLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName || !leadPhone || !results) return;

    const newLead: EnergyCalculationLead = {
      id: Math.random().toString(36).substr(2, 9),
      name: leadName,
      phone: leadPhone,
      tdee: results.tdee,
      goal: conditioning,
      date: new Date().toLocaleString('pt-BR')
    };

    const existingLeads = JSON.parse(localStorage.getItem('topissima_energy_leads') || '[]');
    localStorage.setItem('topissima_energy_leads', JSON.stringify([...existingLeads, newLead]));
    
    setIsLeadSent(true);
    alert("Dados enviados com sucesso! Nossa equipe entrará em contato para uma avaliação detalhada.");
  };

  const nextStep = () => setStep((prev) => (prev + 1) as Step);
  const prevStep = () => setStep((prev) => (prev - 1) as Step);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 animate-fade-in">
      {/* Progress Bar */}
      {step < 4 && (
        <div className="mb-12">
          <div className="flex justify-between mb-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-500 ${step >= s ? 'bg-amber-600 text-white shadow-lg' : 'bg-stone-200 text-stone-400'}`}>
                  {s}
                </div>
                <span className={`text-[8px] font-bold uppercase mt-2 tracking-widest ${step >= s ? 'text-amber-700' : 'text-stone-300'}`}>
                  {s === 1 ? 'Condição' : s === 2 ? 'Biometria' : 'Atividade'}
                </span>
              </div>
            ))}
          </div>
          <div className="h-1 bg-stone-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-amber-600 transition-all duration-500" 
              style={{ width: `${((step - 1) / 2) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      <div className="text-center mb-12">
        <span className="text-amber-600 font-bold uppercase tracking-[0.3em] text-[10px] mb-3 block">Ferramenta Metabólica</span>
        <h2 className="text-4xl md:text-5xl font-bold text-stone-800 mb-4 uppercase tracking-tighter">Gasto Energético Diário</h2>
      </div>

      <div className="bg-white p-8 md:p-14 rounded-[3.5rem] shadow-2xl border border-stone-100 min-h-[500px] flex flex-col justify-center">
        
        {/* STEP 1: CONDICIONAMENTO */}
        {step === 1 && (
          <div className="animate-fade-in space-y-8">
            <h3 className="text-2xl font-bold text-stone-800 text-center uppercase tracking-tighter mb-10">Qual condicionamento físico mais se assemelha ao seu atual?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { id: 'sedentario', label: 'Iniciante / Sedentário', desc: 'Nunca treinei ou estou parado há meses' },
                { id: 'intermediario', label: 'Intermediário', desc: 'Treino regularmente há mais de 6 meses' },
                { id: 'avancado', label: 'Avançado / Atleta', desc: 'Treino intenso focado em performance' },
                { id: 'musculacao', label: 'Praticante de Musculação', desc: 'Foco em ganho de massa e força' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setConditioning(item.id); nextStep(); }}
                  className={`p-6 rounded-3xl border-2 text-left transition-all hover:border-amber-400 group ${conditioning === item.id ? 'border-amber-600 bg-amber-50' : 'border-stone-100 bg-stone-50'}`}
                >
                  <p className="font-bold text-stone-800 uppercase text-xs mb-1 group-hover:text-amber-700">{item.label}</p>
                  <p className="text-[10px] text-stone-400 italic">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: DADOS BIOMÉTRICOS */}
        {step === 2 && (
          <div className="animate-fade-in space-y-10">
            <h3 className="text-2xl font-bold text-stone-800 text-center uppercase tracking-tighter mb-6">Informações Pessoais</h3>
            
            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-1 block text-center">Gênero</label>
              <div className="flex gap-4 max-w-sm mx-auto">
                <button 
                  onClick={() => setGender('female')}
                  className={`flex-1 py-4 rounded-2xl font-bold uppercase text-[10px] tracking-widest transition-all ${gender === 'female' ? 'bg-stone-900 text-white shadow-lg' : 'bg-stone-50 text-stone-400 border border-stone-100'}`}
                >
                  Feminino
                </button>
                <button 
                  onClick={() => setGender('male')}
                  className={`flex-1 py-4 rounded-2xl font-bold uppercase text-[10px] tracking-widest transition-all ${gender === 'male' ? 'bg-stone-900 text-white shadow-lg' : 'bg-stone-50 text-stone-400 border border-stone-100'}`}
                >
                  Masculino
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-1 block mb-2">Idade (anos)</label>
                <input type="number" className="w-full p-5 bg-stone-50 rounded-2xl outline-none focus:border-amber-200 border border-transparent" placeholder="00" value={age} onChange={e => setAge(e.target.value)} />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-1 block mb-2">Peso (kg)</label>
                <input type="number" className="w-full p-5 bg-stone-50 rounded-2xl outline-none focus:border-amber-200 border border-transparent" placeholder="00.0" value={weight} onChange={e => setWeight(e.target.value)} />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-1 block mb-2">Altura (cm)</label>
                <input type="number" className="w-full p-5 bg-stone-50 rounded-2xl outline-none focus:border-amber-200 border border-transparent" placeholder="000" value={height} onChange={e => setHeight(e.target.value)} />
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <button onClick={prevStep} className="flex-1 py-5 bg-stone-100 text-stone-400 rounded-2xl font-bold uppercase text-[10px] tracking-widest">Voltar</button>
              <button onClick={nextStep} disabled={!age || !weight || !height} className="flex-[2] py-5 bg-stone-900 text-white rounded-2xl font-bold uppercase text-[10px] tracking-widest shadow-xl disabled:opacity-30">Continuar</button>
            </div>
          </div>
        )}

        {/* STEP 3: NÍVEL DE ATIVIDADE */}
        {step === 3 && (
          <div className="animate-fade-in space-y-8">
            <h3 className="text-2xl font-bold text-stone-800 text-center uppercase tracking-tighter mb-8">Qual seu nível de atividade física?</h3>
            <div className="space-y-4">
              {[
                { fa: 1.2, label: 'Sedentário', desc: 'Pouco ou nenhum exercício (FA=1.2)', weeks: '0 dias por semana' },
                { fa: 1.4, label: 'Pouco Ativo', desc: 'Exercícios leves (FA=1.4)', weeks: '1 a 2 vezes por semana' },
                { fa: 1.5, label: 'Moderadamente ativo', desc: 'Exercícios moderados (FA=1.5)', weeks: '3 a 5 vezes por semana' },
                { fa: 1.7, label: 'Muito ativo', desc: 'Treinos intensos diários (FA=1.7)', weeks: '6 a 7 vezes por semana' }
              ].map((item) => (
                <button
                  key={item.fa}
                  onClick={() => setActivityFactor(item.fa)}
                  className={`w-full p-6 rounded-3xl border-2 flex items-center justify-between transition-all ${activityFactor === item.fa ? 'border-amber-600 bg-amber-50 shadow-md' : 'border-stone-100 bg-stone-50 hover:border-stone-200'}`}
                >
                  <div className="text-left">
                    <p className={`font-bold uppercase text-xs mb-1 ${activityFactor === item.fa ? 'text-amber-800' : 'text-stone-700'}`}>{item.label}</p>
                    <p className="text-[10px] text-stone-400 font-medium">{item.desc}</p>
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-full ${activityFactor === item.fa ? 'bg-amber-600 text-white' : 'bg-stone-200 text-stone-400'}`}>
                    {item.weeks}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex gap-4 pt-6">
              <button onClick={prevStep} className="flex-1 py-5 bg-stone-100 text-stone-400 rounded-2xl font-bold uppercase text-[10px] tracking-widest">Voltar</button>
              <button onClick={handleCalculate} className="flex-[2] py-5 bg-amber-600 text-white rounded-2xl font-bold uppercase text-[10px] tracking-widest shadow-xl">Ver Resultado Completo</button>
            </div>
          </div>
        )}

        {/* STEP 4: RESULTADOS */}
        {step === 4 && results && (
          <div className="animate-fade-in space-y-12 py-6">
            <div className="bg-stone-900 p-10 md:p-14 rounded-[4rem] text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
              
              <div className="text-center mb-12">
                <p className="text-[10px] font-bold text-amber-500 uppercase tracking-[0.4em] mb-4">Seu Perfil Metabólico</p>
                <h3 className="text-4xl font-black text-white uppercase tracking-tighter">Análise Completa</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-10">
                  <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 shadow-inner">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Gasto Energético Diário (GET)</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-6xl font-black text-amber-500 tracking-tighter">{results.tdee}</span>
                      <span className="text-amber-500 font-bold text-[10px] uppercase">Kcal/dia</span>
                    </div>
                    <p className="text-[9px] text-stone-500 mt-2 italic uppercase">Total de calorias para manter o corpo e atividades.</p>
                  </div>

                  <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Meta de Proteína Diária</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-black text-white tracking-tighter">{results.protein}g</span>
                      <span className="text-stone-500 font-bold text-[10px] uppercase">Por dia</span>
                    </div>
                    <p className="text-[9px] text-stone-500 mt-2 italic uppercase">Fundamental para tônus muscular e saciedade.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-4 border-b border-white/10 pb-2">Planejamento Calórico</h4>
                  
                  <div className="flex justify-between items-center p-5 bg-white/5 rounded-2xl border border-white/5">
                    <span className="text-[10px] font-bold uppercase text-stone-400">Emagrecimento</span>
                    <span className="text-xl font-bold text-red-400">{results.weightLoss} kcal</span>
                  </div>

                  <div className="flex justify-between items-center p-5 bg-white/5 rounded-2xl border border-white/5">
                    <span className="text-[10px] font-bold uppercase text-stone-400">Hipertrofia</span>
                    <span className="text-xl font-bold text-green-400">{results.hypertrophy} kcal</span>
                  </div>

                  <div className="flex justify-between items-center p-5 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                    <span className="text-[10px] font-bold uppercase text-amber-500">Manter Peso</span>
                    <span className="text-xl font-bold text-amber-500">{results.maintenance} kcal</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-12 space-y-4">
                <button onClick={() => setStep(1)} className="w-full py-5 bg-white/10 text-white rounded-3xl font-bold uppercase tracking-widest text-[10px] hover:bg-white/20 transition-all border border-white/10">Refazer Cálculo</button>
              </div>
            </div>

            {/* FORMULÁRIO DE CONTATO (LEAD) */}
            {!isLeadSent ? (
              <div className="bg-white p-10 rounded-[3rem] border border-stone-100 shadow-xl space-y-8 animate-fade-in">
                <div className="text-center">
                  <h4 className="text-xl font-bold text-stone-800 uppercase tracking-tighter">Receber Análise Detalhada</h4>
                  <p className="text-stone-500 text-xs mt-1">Nossa equipe pode te ajudar a alcançar esses objetivos.</p>
                </div>
                <form onSubmit={handleSendLead} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input 
                      required 
                      className="w-full p-4 bg-stone-50 rounded-2xl border border-stone-100 outline-none focus:border-amber-400" 
                      placeholder="Seu Nome" 
                      value={leadName} 
                      onChange={e => setLeadName(e.target.value)} 
                    />
                    <input 
                      required 
                      className="w-full p-4 bg-stone-50 rounded-2xl border border-stone-100 outline-none focus:border-amber-400" 
                      placeholder="Seu WhatsApp" 
                      value={leadPhone} 
                      onChange={e => setLeadPhone(e.target.value)} 
                    />
                  </div>
                  <button type="submit" className="w-full py-5 bg-stone-900 text-white rounded-2xl font-bold uppercase text-[10px] tracking-[0.2em] shadow-xl hover:bg-amber-600 transition-all">Enviar para Avaliação da Clínica</button>
                </form>
              </div>
            ) : (
              <div className="bg-green-50 p-8 rounded-[3rem] border border-green-100 text-center animate-fade-in">
                <p className="text-green-800 font-bold uppercase text-xs tracking-widest">✓ Dados enviados com sucesso!</p>
              </div>
            )}

            {/* CTA AGENDAMENTO */}
            <div className="bg-amber-50 p-10 rounded-[3rem] border border-amber-100 text-center space-y-6">
              <h4 className="font-bold text-amber-900 uppercase tracking-tight text-lg">Deseja ser atendido em nossa clínica?</h4>
              <p className="text-amber-800 text-sm italic max-w-2xl mx-auto leading-relaxed">
                Nossa equipe de especialistas está pronta para transformar seus resultados através de protocolos exclusivos de estética avançada.
              </p>
              <button 
                onClick={() => onNavigate && onNavigate('booking')}
                className="inline-block px-12 py-5 bg-amber-600 text-white rounded-full font-bold uppercase tracking-[0.2em] text-[10px] shadow-2xl hover:bg-amber-500 transition-all active:scale-95"
              >
                Faça o agendamento agora
              </button>
            </div>

            <div className="bg-stone-50 p-10 rounded-[3rem] border border-stone-100 text-center">
              <p className="text-stone-400 font-bold uppercase text-[10px] tracking-widest mb-4">💡 Recomendação Especial Dra. Sônia</p>
              <p className="text-stone-500 text-sm leading-relaxed italic max-w-2xl mx-auto">
                "Este cálculo é uma excelente base para seu planejamento. Na Clínica Topíssima, usamos esses dados para personalizar nossos protocolos de estética avançada. Agende uma avaliação para alinhar esses números com tratamentos que potencializam sua queima de gordura ou definição muscular."
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default EnergyCalculator;
