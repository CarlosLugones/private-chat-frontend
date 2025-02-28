'use client';

import Link from 'next/link';

export default function About() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-base-200">
      <div className="w-full max-w-md">
        <div className="card bg-base-100 rounded-lg border border-gray-700">
          <div className="card-body p-8">
            <h1 className="text-3xl font-bold text-center mb-6">
              About Private Chat
            </h1>
            
            <div className="space-y-4">
              <p>
                Private Chat is a secure messaging application designed to provide
                anonymous and secure communication for individuals and teams who
                value their privacy.
              </p>
              
              <h2 className="text-xl font-semibold text-center mt-10">Key Features</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Private chat rooms.</li>
                <li>Real-time messaging.</li>
                <li>No message history or logs are stored on the server.</li>
                <li>Fully anonymous, no login is required, no password, no email, no way to identify the chat participants.</li>
                <li>The chat messages are only related between participants. When you close the browser tab, the messages are lost forever.</li>
                <li>Open-source and free to use. You can host your own instance if you don't trust this one.</li>
              </ul>
              
              <figure className="flex flex-col items-center mt-10">
                  <blockquote>
                      <p className="text-base-content/70 italic text-center">
                        "We took privacy for granted. Now we have to take it back."
                      </p>
                  </blockquote>
                  <figcaption className="flex items-center justify-center mt-2 gap-2">
                      <img className="w-5 h-5 rounded-full" src="https://avatars.githubusercontent.com/u/18733370?v=4" alt="Carlos Lugones" />
                      <cite className="font-medium text-base-content/70">
                        Carlos Lugones
                      </cite>
                  </figcaption>
              </figure>
              
              <div className="mt-10 text-center">
                <Link 
                  href="/"
                  className="btn btn-primary btn-block"
                >
                  Let's Chat!
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
