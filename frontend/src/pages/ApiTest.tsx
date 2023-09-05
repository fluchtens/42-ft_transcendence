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
    <div className="flex items-center justify-center">
      <div className="bg-secondary shadow-lg rounded-lg p-[3rem]">
        <h1 className="text-2xl font-medium" >Response data from http://localhost:3000/</h1><br/>
        <p className="text-lg">{dataFromLocalhost}</p>
      </div>
    </div>
  );
}

export default ApiTest
