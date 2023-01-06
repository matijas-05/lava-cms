import { client } from "api/trpc";

async function One() {
	const { greeting } = await client.greeting.query({ name: "T3 App" });
	const user = await client.getUser.query({ name: "szymuś" });

	return (
		<main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
			<div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
				<h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
					<span className="text-[hsl(280,100%,70%)]">{greeting}</span>
				</h1>
				<h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
					<span className="text-[hsl(280,100%,70%)]">
						{user.name}
					</span>
				</h1>
			</div>
		</main>
	);
}

export default One;
