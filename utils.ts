
export const formatPhone = (value: string) => {
  if (!value) return "";
  const phoneNumber = value.replace(/\D/g, "").slice(0, 11);
  const phoneNumberLength = phoneNumber.length;
  if (phoneNumberLength <= 2) return phoneNumber;
  if (phoneNumberLength <= 6) {
    return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2)}`;
  }
  if (phoneNumberLength <= 10) {
    return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 6)}-${phoneNumber.slice(6)}`;
  }
  return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 3)} ${phoneNumber.slice(3, 7)}-${phoneNumber.slice(7)}`;
};

export const formatCPF = (value: string) => {
  if (!value) return "";
  const cpf = value.replace(/\D/g, "").slice(0, 11);
  const cpfLength = cpf.length;
  if (cpfLength <= 3) return cpf;
  if (cpfLength <= 6) {
    return `${cpf.slice(0, 3)}.${cpf.slice(3)}`;
  }
  if (cpfLength <= 9) {
    return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6)}`;
  }
  return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;
};

export const formatName = (value: string) => {
  if (!value) return "";
  return value
    .toLowerCase()
    .split(" ")
    .map((word) => {
      if (["da", "de", "do", "das", "dos", "e"].includes(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
};

export const calculateAge = (birthDate: string) => {
  if (!birthDate) return 0;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};
