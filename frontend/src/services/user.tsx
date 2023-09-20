import axios, {AxiosResponse} from 'axios';
import { User } from "../utils/user.interface";

const apiUrl: string = `${import.meta.env.VITE_API_URL}:3000/api/v1/user`;

export async function getUserList(): Promise<User[]> {

  const response: AxiosResponse<User[]> = await axios.get(apiUrl);
  return (response.data);
}

export function createUser(userData: User) {
  axios.post(apiUrl, userData, {
    headers: {
      "Content-Type": "application/json"
    }
  });
}
