import axios, {AxiosResponse} from 'axios';

export interface User {
  id: number;
  userName: string;
  imageUrl: string;
}

export async function getUserList(): Promise<User[]> {
  const apiUrl: string = `${import.meta.env.VITE_API_URL}:3000/api/v1/user`;

  const response: AxiosResponse<User[]> = await axios.get(apiUrl);
  return (response.data);
}
