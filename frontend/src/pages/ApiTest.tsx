import { useEffect, useState } from 'react';
import axios from 'axios';

function ApiTest() {
  const [dataFromLocalhost, setDataFromLocalhost] = useState<string>('');

  useEffect(() => {
    const apiUrl = 'http://localhost:3000/';

    axios.get(apiUrl)
      .then((response) => {
        setDataFromLocalhost(response.data);
      })
      .catch((error) => {
        console.log('Erreur lors de la récupération des données depuis localhost:', error);
      });
  }, []);

  return (
    <div className="flex justify-center">
      <div className="bg-secondary border border-quaternary rounded-lg p-[4rem]">
        <h1 className="text-2xl font-medium" >Response data from http://localhost:3000/</h1>
        <br/>
        <p className="text-lg">{dataFromLocalhost}</p>
      </div>
    </div>
  );
}

export default ApiTest
