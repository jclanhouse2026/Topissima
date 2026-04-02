
import React, { useState } from 'react';
import { User, Address } from '../types';
import { formatName, formatCPF, formatPhone } from '../utils';

interface RegistrationExtraInfoProps {
  user: User;
  onComplete: (updatedUser: User) => void;
}

const RegistrationExtraInfo: React.FC<RegistrationExtraInfoProps> = ({ user, onComplete }) => {
  const [formData, setFormData] = useState({
    name: user.name || '',
    cpf: user.cpf || '',
    phone: user.phone || '',
    secondaryPhone: '',
    birthDate: '',
    street: '',
    number: '',
    neighborhood: '',
    city: '',
    state: '',
    cep: '',
    lgpdConsent: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const address: Address = {
      street: formData.street,
      number: formData.number,
      neighborhood: formData.neighborhood,
      city: formData.city,
      state: formData.state,
      cep: formData.cep
    };

    const updatedUser: User = {
      ...user,
      name: formData.name,
      cpf: formData.cpf,
      phone: formData.phone,
      secondaryPhone: formData.secondaryPhone,
      birthDate: formData.birthDate,
      address,
      isProfileComplete: true
    };
    onComplete(updatedUser);
  };

  return (
    <div className="max-w-3xl mx-auto p-12 bg-white rounded-[3rem] shadow-2xl border border-stone-100 my-10 animate-fade-in">
      <h2 className="text-3xl font-bold text-stone-800 mb-8 text-center uppercase tracking-tighter">Completar Cadastro</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">Nome Completo *</label>
            <input required className="w-full p-4 rounded-2xl border border-stone-200 bg-stone-50" value={formData.name || ''} onChange={e => setFormData({...formData, name: formatName(e.target.value)})} />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">CPF *</label>
            <input required className="w-full p-4 rounded-2xl border border-stone-200 bg-stone-50" value={formData.cpf || ''} onChange={e => setFormData({...formData, cpf: formatCPF(e.target.value)})} maxLength={14} />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">Data de Nascimento *</label>
            <input type="date" required className="w-full p-4 rounded-2xl border border-stone-200 bg-stone-50" value={formData.birthDate || ''} onChange={e => setFormData({...formData, birthDate: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">Telefone Principal *</label>
            <input required className="w-full p-4 rounded-2xl border border-stone-200 bg-stone-50" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: formatPhone(e.target.value)})} maxLength={16} />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">Telefone Secundário (Opcional)</label>
            <input className="w-full p-4 rounded-2xl border border-stone-200 bg-stone-50" value={formData.secondaryPhone || ''} onChange={e => setFormData({...formData, secondaryPhone: formatPhone(e.target.value)})} maxLength={16} />
          </div>
        </div>

        <div className="pt-6 border-t border-stone-100">
          <h3 className="text-sm font-bold text-stone-800 uppercase tracking-widest mb-4">Endereço</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2"><input required placeholder="Rua" className="w-full p-4 rounded-2xl border border-stone-200 bg-stone-50" value={formData.street || ''} onChange={e => setFormData({...formData, street: e.target.value})} /></div>
            <div><input required placeholder="Nº" className="w-full p-4 rounded-2xl border border-stone-200 bg-stone-50" value={formData.number || ''} onChange={e => setFormData({...formData, number: e.target.value})} /></div>
            <div><input required placeholder="Bairro" className="w-full p-4 rounded-2xl border border-stone-200 bg-stone-50" value={formData.neighborhood || ''} onChange={e => setFormData({...formData, neighborhood: e.target.value})} /></div>
            <div><input required placeholder="Cidade" className="w-full p-4 rounded-2xl border border-stone-200 bg-stone-50" value={formData.city || ''} onChange={e => setFormData({...formData, city: e.target.value})} /></div>
            <div><input required placeholder="CEP" className="w-full p-4 rounded-2xl border border-stone-200 bg-stone-50" value={formData.cep || ''} onChange={e => setFormData({...formData, cep: e.target.value})} /></div>
          </div>
        </div>

        <button type="submit" className="w-full py-5 bg-stone-800 text-white rounded-2xl font-bold uppercase tracking-[0.2em] hover:bg-stone-700 transition-all shadow-xl">Salvar Cadastro</button>
      </form>
    </div>
  );
};

export default RegistrationExtraInfo;
