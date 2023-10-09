import { User } from "../utils/user.interface";

const apiUrl: string = `${import.meta.env.VITE_BACK_URL}/api/v1/user`;

export async function getUserList(): Promise<User[]> {
  const response: Response = await fetch(apiUrl);
  if (response.ok) {
    const data: User[] = await response.json();
    return data;
  } else {
    throw new Error(`Erreur HTTP! Statut de la réponse : ${response.status}`);
  }
}

export function createUser(userData: User) {
  fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(
          `Erreur HTTP! Statut de la réponse : ${response.status}`
        );
      }
    })
    .catch((error) => {
      console.error("Il y a eu un problème avec l'opération fetch :", error);
    });
}
