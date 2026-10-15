import { Code2 } from "lucide-react";

function AuthLayout({ children, title, description }) {
  return (
    <div className="
      min-h-screen
      grid
      lg:grid-cols-2
    ">

      {/* Left Side */}

      <div className="
        hidden
        lg:flex
        bg-slate-950
        text-white
        flex-col
        justify-center
        px-16
      ">

        <div className="
          flex
          items-center
          gap-3
          mb-10
        ">

          <div className="
            w-14
            h-14
            rounded-2xl
            bg-blue-600
            flex
            items-center
            justify-center
          ">

            <Code2 size={32}/>

          </div>

          <h1 className="text-4xl font-bold">
            CodeTrack
          </h1>

        </div>


        <h2 className="
          text-5xl
          font-extrabold
          leading-tight
        ">

          Track.
          Analyze.
          Improve.

        </h2>


        <p className="
          text-slate-400
          text-lg
          mt-6
          max-w-md
        ">

          Improve your competitive programming journey
          with powerful analytics and progress tracking.

        </p>


        <div className="
          mt-12
          space-y-5
        ">

          <p>
            ✓ Codeforces Rating Tracking
          </p>

          <p>
            ✓ Contest Performance Analytics
          </p>

          <p>
            ✓ Personal Growth Dashboard
          </p>

        </div>

      </div>


      {/* Right Side */}

      <div className="
        flex
        items-center
        justify-center
        p-6
      ">

        <div className="
          w-full
          max-w-md
        ">

          <h1 className="
            text-3xl
            font-bold
          ">

            {title}

          </h1>


          <p className="
            text-slate-500
            mt-3
            mb-8
          ">

            {description}

          </p>


          {children}


        </div>

      </div>

    </div>
  );
}

export default AuthLayout;