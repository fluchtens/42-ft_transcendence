import HelloWorldApi from './HelloWorldApi';

function Home() {
	return (
		<>
			<div className="py-20 flex items-center justify-center">
				<h1 className="text-6xl font-medium">Home</h1>
			</div>
			<HelloWorldApi/>
		</>
	)
}

export default Home
