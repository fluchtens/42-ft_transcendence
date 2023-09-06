import { Link } from 'react-router-dom'
import pongLogo from '/pong_logo.png'

function Login() {
  return (

    <main className="flex flex-col items-center justify-center p-5 mx-auto md:h-screen">

        <div className="flex items-center mb-4">
          <img src={pongLogo} className="w-10 h-10 mr-3"/>
          <Link to={'/'} className="text-3xl font-semibold">ft_transcendence</Link>
        </div>

        <div className="bg-secondary rounded-lg shadow-lg w-full md:max-w-md">
            <div className="p-5 space-y-3 md:p-8 md:space-y-6">

                <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl">Sign in to your account</h1>

                <form className="space-y-3 md:space-y-6" action="#">
                    <div>
                        <label htmlFor="username" className="block mb-2 text-sm font-medium">Username</label>
                        <input type="text" name="username" id="username" placeholder="fluchten" className="bg-gray-700 border border-gray-600 placeholder-gray-400 rounded-lg w-full p-2.5 md:text-sm" required/>
                    </div>

                    <div>
                        <label htmlFor="password" className="block mb-2 text-sm font-medium">Password</label>
                        <input type="password" name="password" id="password" placeholder="••••••••" className="bg-gray-700 border border-gray-600 placeholder-gray-400 rounded-lg w-full p-2.5 md:text-sm" required/>
                    </div>

                    <button type="submit" className="text-white bg-quaternary hover:bg-tertiary rounded-lg text-sm font-medium w-full p-2.5">Sign in</button>
                </form>

                <button className="text-white bg-secondary hover:bg-primary border border-gray-500 rounded-lg text-sm font-medium w-full p-2.5">Sign in with 42</button>

                <div className="flex text-sm">
                    <p className="font-light text-gray-400 mr-1">Don’t have an account yet?</p>
                    <Link to={'/'} className="font-medium text-gray-400 hover:underline">Sign up</Link>
                </div>

            </div>
        </div>

    </main>
  );
}

export default Login
