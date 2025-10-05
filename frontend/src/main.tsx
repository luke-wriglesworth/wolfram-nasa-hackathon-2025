import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "@/Layout";
import NotFoundPage from "@/pages/404";
import Landing from "@/pages/landing/Landing";
import "./styles.css";

import { Toaster as SonnerToaster, toast } from "sonner";
export { toast };

import type { ToasterProps } from "sonner";

export function Toaster(props: ToasterProps) {
	return <SonnerToaster richColors closeButton {...props} />;
}

const router = createBrowserRouter([
	{
		element: <Layout />,
		children: [
			{
				path: "/",
				element: (
					<Landing />
				),
			},
			{
				path: "wolfram-nasa-hackathon-2025",
				element: (
					<Landing />
				),
			},
			{
				path: "*",
				element: <NotFoundPage />,
			},
		],
	},
]);

const queryClient = new QueryClient();

const root = document.getElementById("root")!;
createRoot(root).render(
	<StrictMode>
		<QueryClientProvider client={queryClient}>
			<RouterProvider router={router} />
			{/* Global toaster */}
			<Toaster style={{ marginTop: 40 }} position="top-right" />
		</QueryClientProvider>
	</StrictMode>,
);
