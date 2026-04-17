import axios from "axios";

//url cảu backend
const  API_URL = "http://127.0.0.1:8000/api";

export const getSongs = async () => {
    const response = await axios.get('${API_URL}/songs/');
    return response.data;
};