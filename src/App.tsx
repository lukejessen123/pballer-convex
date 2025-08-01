"use client";

import {
  Authenticated,
  Unauthenticated,
  useConvexAuth,
  useMutation,
  useQuery,
} from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { GameDayDemo } from "./components/GameDayDemo";
import { PlayDemo } from "./components/PlayDemo";

export default function App() {
  return (
    <>
      <header className="sticky top-0 z-10 bg-light dark:bg-dark p-4 border-b-2 border-slate-200 dark:border-slate-800">
        Convex + React + Convex Auth
        <SignOutButton />
      </header>
      <main className="p-8 flex flex-col gap-16">
        <h1 className="text-4xl font-bold text-center">
          Convex + React + Convex Auth
        </h1>
        <Authenticated>
          <Content />
        </Authenticated>
        <Unauthenticated>
          <SignInForm />
        </Unauthenticated>
      </main>
    </>
  );
}

function SignOutButton() {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  return (
    <>
      {isAuthenticated && (
        <button
          className="bg-slate-200 dark:bg-slate-800 text-dark dark:text-light rounded-md px-2 py-1"
          onClick={() => void signOut()}
        >
          Sign out
        </button>
      )}
    </>
  );
}

function SignInForm() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-8 w-96 mx-auto">
      <p>Log in to see the numbers</p>
      <form
        className="flex flex-col gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          console.log('email', email)
          try {
            await signIn("custom", { email, flow })
          } catch (error) {
            if (!(error instanceof Error)) {
              setError("An unknown error occurred");
              return;
            }
            setError(error.message);
          }
        }}
      >
      <input
        className="bg-light dark:bg-dark text-dark dark:text-light rounded-md p-2 border-2 border-slate-200 dark:border-slate-800"
        type="email"
        name="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button
        className="bg-dark dark:bg-light text-light dark:text-dark rounded-md"
        type="submit"
      >
        {flow === "signIn" ? "Sign in" : "Sign up"}
      </button>
      <div className="flex flex-row gap-2">
        <span>
          {flow === "signIn"
            ? "Don't have an account?"
            : "Already have an account?"}
        </span>
        <span
          className="text-dark dark:text-light underline hover:no-underline cursor-pointer"
          onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
        >
          {flow === "signIn" ? "Sign up instead" : "Sign in instead"}
        </span>
      </div>
      {error && (
        <div className="bg-red-500/20 border-2 border-red-500/50 rounded-md p-2">
          <p className="text-dark dark:text-light font-mono text-xs">
            Error signing in: {error}
          </p>
        </div>
      )}
    </form>
    </div >
  );
}

function Content() {
  const clubs = useQuery(api.myFunctions.listClubs);

  if (clubs === undefined) {
    return (
      <div className="mx-auto">
        <p>loading... (consider a loading skeleton)</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Pickleball League Manager</h1>
        <p className="text-lg text-gray-600">
          Welcome to your Convex-powered pickleball league management system!
        </p>
      </div>

      {/* Demo Components */}
      <GameDayDemo />
      
      {/* Play Demo */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Play Functionality Demo</h2>
        <p className="text-gray-600 mb-4">
          This demonstrates the play functionality including court management, scoring, and substitute handling.
        </p>
        <PlayDemo />
      </div>

      {/* Clubs Section */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Available Clubs</h2>
        {clubs && clubs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clubs.map((club) => (
              <div key={club._id} className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-semibold">{club.name}</h3>
                {club.description && <p className="text-gray-600 text-sm">{club.description}</p>}
                {club.location && <p className="text-gray-500 text-xs">{club.location}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No clubs found. Create some clubs to get started!</p>
        )}
      </div>

      <div className="flex flex-col">
        <p className="text-lg font-bold">Migration Complete!</p>
        <div className="flex gap-2">
          <div className="flex flex-col gap-2 w-1/2">
            <ResourceCard
              title="Convex docs"
              description="Read comprehensive documentation for all Convex features."
              href="https://docs.convex.dev/home"
            />
            <ResourceCard
              title="Convex Auth"
              description="Learn about authentication and user management in Convex."
              href="https://docs.convex.dev/auth"
            />
          </div>
          <div className="flex flex-col gap-2 w-1/2">
            <ResourceCard
              title="Templates"
              description="Browse our collection of templates to get started quickly."
              href="https://www.convex.dev/templates"
            />
            <ResourceCard
              title="Discord"
              description="Join our developer community to ask questions, trade tips & tricks,
            and show off your projects."
              href="https://www.convex.dev/community"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ResourceCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <div className="flex flex-col gap-2 bg-slate-200 dark:bg-slate-800 p-4 rounded-md h-28 overflow-auto">
      <a href={href} className="text-sm underline hover:no-underline">
        {title}
      </a>
      <p className="text-xs">{description}</p>
    </div>
  );
}
