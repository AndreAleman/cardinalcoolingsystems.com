export const adminCompanyFields = [
  "id",
  "name",
  "email",
  "phone",
  "address",
  "city",
  "state",
  "zip",
  "country",
  "logo_url",
  "currency_code",
  "status",
  "welcome_code",
  "created_at",
  "employees.id",
  "employees.role",
  "employees.spending_limit",
  "employees.customer.id",
  "employees.customer.email",
  "employees.customer.first_name",
  "employees.customer.last_name",
];

export const adminCompanyQueryConfig = {
  list: { defaults: adminCompanyFields, isList: true },
  retrieve: { defaults: adminCompanyFields, isList: false },
};
