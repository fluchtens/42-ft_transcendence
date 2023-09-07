import { useEffect, useState } from 'react';
import { getHelloWorld } from '../api/getHelloWorld';

function HelloWorldApi() {
  const [helloWorldApi, setHelloWorldApi] = useState<string>('');

  const handleSucess = (data: string) => {
    setHelloWorldApi(data);
  };

  const handleError = (error: string) => {
    setHelloWorldApi(error);
  }

  useEffect(() => {
    getHelloWorld(handleSucess, handleError);
  }, []);

  return (
    <div className="flex items-center justify-center">
      <div className="bg-secondary shadow-lg rounded-lg p-[3rem]">
        <h1 className="text-2xl font-medium" >Response data from http://localhost:3000/</h1><br/>
        <p className="text-lg">{helloWorldApi}</p>
      </div>
    </div>
  );
}

export default HelloWorldApi
