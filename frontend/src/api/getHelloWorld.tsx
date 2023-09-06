import axios, {AxiosResponse} from 'axios';

export async function getHelloWorld(onSuccess: (data: string) => void, onError: (error: string) => void): Promise<void> {
  const apiUrl: string = "http://localhost:3000/";

  try {
    const response: AxiosResponse = await axios.get(apiUrl);
    onSuccess(response.data);
  } catch (error) {
    console.error("Data recovery error:", error)
    onError("Data recovery error...");
  }
}
