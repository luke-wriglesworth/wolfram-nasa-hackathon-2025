import { Outlet, ScrollRestoration } from "react-router-dom";

const Layout = () => {
	return (
		<>
			<main className="main-container">
				<Outlet />
			</main>
			<ScrollRestoration />
		</>
	);
};

export default Layout;
