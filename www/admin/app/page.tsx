import Image from "next/image";
import { Inter } from "@next/font/google";
import styles from "../src/styles/Home.module.css";
import "../src/styles/globals.css";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
	return (
		<>
			<main className={styles.main}>
				<div className={styles.description}>
					<p>
						Get started by editing&nbsp;
						<code className={styles.code}>pages/index.tsx</code>
					</p>
					<div>
						<a
							href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
							target="_blank"
							rel="noopener noreferrer"
						>
							By{" "}
							<Image
								src="/admin/vercel.svg"
								alt="Vercel Logo"
								className={styles.vercelLogo}
								width={100}
								height={24}
								priority
							/>
						</a>
					</div>
				</div>

				<div className={styles.center}>
					<Image
						className={styles.logo}
						src="/admin/next.svg"
						alt="Next.js Logo"
						width={180}
						height={37}
						priority
					/>
					<div className={styles.thirteen}>
						<Image
							src="/admin/thirteen.svg"
							alt="13"
							width={40}
							height={31}
							priority
						/>
					</div>
				</div>

				<div className={styles.grid}>
					<a
						href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
						className={styles.card}
						target="_blank"
						rel="noopener noreferrer"
					>
						<h2 className={inter.className}>
							Docs <span>-&gt;</span>
						</h2>
						<p className={inter.className}>
							Find in-depth information about Next.js features
							and&nbsp;API.
						</p>
					</a>

					<a
						href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
						className={styles.card}
						target="_blank"
						rel="noopener noreferrer"
					>
						<h2 className={inter.className}>
							Learn <span>-&gt;</span>
						</h2>
						<p className={inter.className}>
							Learn about Next.js in an interactive course
							with&nbsp;quizzes!
						</p>
					</a>

					<a
						href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
						className={styles.card}
						target="_blank"
						rel="noopener noreferrer"
					>
						<h2 className={inter.className}>
							Templates <span>-&gt;</span>
						</h2>
						<p className={inter.className}>
							Discover and deploy boilerplate example
							Next.js&nbsp;projects.
						</p>
					</a>

					<a
						href="https://vercel.com/new?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
						className={styles.card}
						target="_blank"
						rel="noopener noreferrer"
					>
						<h2 className={inter.className}>
							Deploy <span>-&gt;</span>
						</h2>
						<p className={inter.className}>
							Instantly deploy your Next.js site to a shareable
							URL with&nbsp;Vercel.
						</p>
					</a>

					<Link href="/admin/one" className={styles.card}>
						<h2 className={inter.className}>
							One <span>-&gt;</span>
						</h2>
						<p className={inter.className}>One.</p>
					</Link>

					<Link href="/" className={styles.card}>
						<h2 className={inter.className}>
							Frontend <span>-&gt;</span>
						</h2>
						<p className={inter.className}>Frontend.</p>
					</Link>
				</div>
			</main>
		</>
	);
}
