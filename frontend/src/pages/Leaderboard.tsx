import UserList from "../components/UserList";

function Leaderboard() {
	return (
		<>
			<div className="py-[3rem] flex items-center justify-center">
				<h1 className="text-6xl font-medium">Leaderboard</h1>
			</div>
			<UserList/>
		</>
	)
}

export default Leaderboard
