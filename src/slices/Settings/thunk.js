import { CountriesAPI } from "../../helpers/backend_helper";
import { makeCRUDThunks } from "../../helpers/thunk_factory";

export const {
  list: getCountries,
  create: addCountry,
  update: updateCountry,
  delete: deleteCountry,
} = makeCRUDThunks("settings/country", CountriesAPI);
