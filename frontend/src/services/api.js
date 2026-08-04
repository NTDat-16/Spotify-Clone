import axios from "axios";
import { API_BASE_URL } from "../config/api";

export const getSongs = async () => {
    const response = await axios.get(`${API_BASE_URL}/songs/`);
    return response.data;
};
