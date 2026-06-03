const roundMoney = (value) => Math.round((Number(value) || 0) * 100) / 100;

const parseMoney = (value) => {
  if (value === null || value === undefined || value === '') return 0;
  const parsed = Number(String(value).replace(/,/g, '').trim());
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

const calculatePayroll = (data = {}) => {
  const salary_basic = parseMoney(data.salary_basic ?? data.basic);
  const salary_hra = parseMoney(data.salary_hra ?? data.hra);
  const salary_medical_allowance = parseMoney(data.salary_medical_allowance ?? data.medical_allowance);
  const salary_travel_allowance = parseMoney(data.salary_travel_allowance ?? data.travel_allowance);
  const salary_other_allowance = parseMoney(data.salary_other_allowance ?? data.other_allowance ?? data.other);

  const salary_gross = roundMoney(
    salary_basic +
    salary_hra +
    salary_medical_allowance +
    salary_travel_allowance +
    salary_other_allowance
  );

  const salary_pf = roundMoney(salary_basic * 0.12);
  const salary_esic = salary_gross > 0 && salary_gross <= 21000 ? roundMoney(salary_gross * 0.0075) : 0;
  const salary_professional_tax = salary_gross > 10000 ? 200 : 0;
  const salary_lwf = 0;
  const salary_total_deduction = roundMoney(salary_pf + salary_esic + salary_professional_tax + salary_lwf);
  const salary_net = roundMoney(Math.max(0, salary_gross - salary_total_deduction));
  const employer_pf = roundMoney(salary_basic * 0.13);
  const employer_esic = salary_gross > 0 && salary_gross <= 21000 ? roundMoney(salary_gross * 0.0325) : 0;

  return {
    salary_basic,
    salary_hra,
    salary_medical_allowance,
    salary_travel_allowance,
    salary_other_allowance,
    salary_gross,
    salary_pf,
    salary_esic,
    salary_professional_tax,
    salary_lwf,
    salary_total_deduction,
    salary_net,
    employer_pf,
    employer_esic
  };
};

module.exports = {
  calculatePayroll,
  parseMoney
};
