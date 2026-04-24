import { CitiesAPI, CountriesAPI } from "../../helpers/backend_helper";
import { makeCRUDThunks } from "../../helpers/thunk_factory";

export const {
  list: getCountries,
  create: addCountry,
  update: updateCountry,
  delete: deleteCountry,
} = makeCRUDThunks("settings/country", CountriesAPI);

export const {
  list: getCities,
  create: addCity,
  update: updateCity,
  delete: deleteCity,
} = makeCRUDThunks("settings/city", CitiesAPI);
