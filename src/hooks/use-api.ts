import { useContext } from "react";
import { ApiContext } from "src/contexts/api-context";

export const useApi = () => useContext(ApiContext);