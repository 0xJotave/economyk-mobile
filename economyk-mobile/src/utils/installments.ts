export const getInstallmentColor = (current?: number, total?: number) => {
  if (!current || !total) return { bg: "#e3f2fd", text: "#1565c0" };

  const ratio = current / total;

  if (ratio >= 0.7) {
    return { bg: "#e8f5e9", text: "#2e7d32" }; // Verde (acabando/alívio)
  }

  if (ratio >= 0.4) {
    return { bg: "#fff3e0", text: "#ef6c00" }; // Laranja
  }
  return { bg: "#e3f2fd", text: "#1565c0" }; // Azul padrão
};
