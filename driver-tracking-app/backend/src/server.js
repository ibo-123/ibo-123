const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");

const tripRoutes = require("./routes/tripRoutes");
const connectDatabase = require("./config/database");
const Trip = require("./model/Trip");
const generateTripId = require("./utils/generateTripId");
const authRoutes = require("./routes/authRoutes");
dotenv.config();

/*
|--------------------------------------------------------------------------
| APP
|--------------------------------------------------------------------------
*/

const app = express();
const server = http.createServer(app);

/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
*/

const allowedOrigins = [
  "http://localhost:5173",
  "https://driver-tracking-app.vercel.app",
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests without Origin
    // e.g. Postman, curl, server-to-server
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log("❌ CORS blocked:", origin);

    return callback(
      new Error("Not allowed by CORS")
    );
  },

  methods: [
    "GET",
    "POST",
    "PUT",
    "DELETE",
    "OPTIONS",
  ],

  credentials: true,
};

/*
|--------------------------------------------------------------------------
| EXPRESS
|--------------------------------------------------------------------------
*/

app.use(cors(corsOptions));

app.use(express.json());

/*
|--------------------------------------------------------------------------
| SOCKET.IO
|--------------------------------------------------------------------------
*/
app.use("/api/auth", authRoutes);
const io = new Server(server, {
  cors: {
    origin: corsOptions.origin,
    methods: corsOptions.methods,
    credentials: true,
  },

  transports: [
    "polling",
    "websocket",
  ],
});

/*
|--------------------------------------------------------------------------
| SOCKET AUTHENTICATION
|--------------------------------------------------------------------------
|
| Drivers send:
|
| socket.auth = {
|   token: "JWT..."
| }
|
| Customers don't need JWT because they only
| need a valid trip ID to watch a trip.
|
*/

io.use((socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token;

    /*
    |--------------------------------------------------------------------------
    | Customer connection
    |--------------------------------------------------------------------------
    |
    | No token means this is treated as a customer
    | connection.
    |
    */

    if (!token) {
      socket.user = null;

      console.log(
        "👤 Customer socket connecting:",
        socket.id
      );

      return next();
    }

    /*
    |--------------------------------------------------------------------------
    | Driver connection
    |--------------------------------------------------------------------------
    */

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    socket.user = decoded;

    console.log(
      "🔐 Driver authenticated:",
      decoded.driverId
    );

    next();
  } catch (error) {
    console.error(
      "❌ Socket authentication failed:",
      error.message
    );

    return next(
      new Error(
        "Invalid authentication token"
      )
    );
  }
});

/*
|--------------------------------------------------------------------------
| SOCKET CONNECTION
|--------------------------------------------------------------------------
*/

io.on("connection", (socket) => {
  console.log(
    "🔌 Client connected:",
    socket.id
  );

  /*
  |--------------------------------------------------------------------------
  | DRIVER STARTS TRACKING
  |--------------------------------------------------------------------------
  */

  socket.on(
    "driver:startTracking",
    async () => {
      try {
        /*
        |--------------------------------------------------------------------------
        | Driver must be authenticated
        |--------------------------------------------------------------------------
        */

        if (!socket.user) {
          socket.emit(
            "tracking:error",
            {
              message:
                "Driver authentication required.",
            }
          );

          return;
        }

        /*
        |--------------------------------------------------------------------------
        | Get driver identity from JWT
        |--------------------------------------------------------------------------
        */

        const driverId =
          socket.user.driverId;

        if (!driverId) {
          socket.emit(
            "tracking:error",
            {
              message:
                "Driver identity not found.",
            }
          );

          return;
        }

        /*
        |--------------------------------------------------------------------------
        | Generate Trip ID
        |--------------------------------------------------------------------------
        */

        const tripId =
          generateTripId();

        console.log(
          `🚚 Driver ${driverId} starting trip ${tripId}`
        );

        /*
        |--------------------------------------------------------------------------
        | Create trip
        |--------------------------------------------------------------------------
        */

        const trip =
          await Trip.create({
            tripId,
            driverId,
            status: "tracking",

            destination: {
              latitude: 9.0192,
              longitude: 38.7525,
              address:
                "Addis Ababa Destination",
            },
          });

        console.log(
          `✅ Trip created: ${trip.tripId}`
        );

        /*
        |--------------------------------------------------------------------------
        | Driver joins trip room
        |--------------------------------------------------------------------------
        */

        socket.join(
          `trip:${tripId}`
        );

        /*
        |--------------------------------------------------------------------------
        | Tell driver tracking started
        |--------------------------------------------------------------------------
        */

        socket.emit(
          "driver:trackingStarted",
          {
            tripId:
              trip.tripId,

            driverId:
              trip.driverId,

            destination:
              trip.destination,
          }
        );
      } catch (error) {
        console.error(
          "❌ Start tracking error:",
          error
        );

        socket.emit(
          "tracking:error",
          {
            message:
              "Could not start tracking.",
          }
        );
      }
    }
  );

  /*
  |--------------------------------------------------------------------------
  | DRIVER SENDS GPS LOCATION
  |--------------------------------------------------------------------------
  */

  socket.on(
    "driver:locationUpdate",
    async (data) => {
      try {
        /*
        |--------------------------------------------------------------------------
        | Driver must be authenticated
        |--------------------------------------------------------------------------
        */

        if (!socket.user) {
          socket.emit(
            "tracking:error",
            {
              message:
                "Driver authentication required.",
            }
          );

          return;
        }

        /*
        |--------------------------------------------------------------------------
        | Get driver ID ONLY from JWT
        |--------------------------------------------------------------------------
        */

        const driverId =
          socket.user.driverId;

        if (!driverId) {
          socket.emit(
            "tracking:error",
            {
              message:
                "Driver identity not found.",
            }
          );

          return;
        }

        /*
        |--------------------------------------------------------------------------
        | Get GPS data
        |--------------------------------------------------------------------------
        */

        const {
          tripId,
          latitude,
          longitude,
          accuracy,
        } = data;

        console.log(
          "📍 Location received:",
          {
            tripId,
            driverId,
            latitude,
            longitude,
            accuracy,
          }
        );

        /*
        |--------------------------------------------------------------------------
        | Validate Trip ID
        |--------------------------------------------------------------------------
        */

        if (!tripId) {
          socket.emit(
            "tracking:error",
            {
              message:
                "tripId is required.",
            }
          );

          return;
        }

        /*
        |--------------------------------------------------------------------------
        | Validate coordinates
        |--------------------------------------------------------------------------
        */

        if (
          typeof latitude !== "number" ||
          typeof longitude !== "number"
        ) {
          socket.emit(
            "tracking:error",
            {
              message:
                "latitude and longitude must be numbers.",
            }
          );

          return;
        }

        /*
        |--------------------------------------------------------------------------
        | Validate latitude range
        |--------------------------------------------------------------------------
        */

        if (
          latitude < -90 ||
          latitude > 90
        ) {
          socket.emit(
            "tracking:error",
            {
              message:
                "Invalid latitude.",
            }
          );

          return;
        }

        /*
        |--------------------------------------------------------------------------
        | Validate longitude range
        |--------------------------------------------------------------------------
        */

        if (
          longitude < -180 ||
          longitude > 180
        ) {
          socket.emit(
            "tracking:error",
            {
              message:
                "Invalid longitude.",
            }
          );

          return;
        }

        /*
        |--------------------------------------------------------------------------
        | Find Trip
        |--------------------------------------------------------------------------
        */

        const trip =
          await Trip.findOne({
            tripId,
          });

        if (!trip) {
          socket.emit(
            "tracking:error",
            {
              message:
                "Trip not found.",
            }
          );

          return;
        }

        /*
        |--------------------------------------------------------------------------
        | Verify Driver Owns Trip
        |--------------------------------------------------------------------------
        */

        if (
          trip.driverId !== driverId
        ) {
          console.log(
            `🚨 Unauthorized location attempt`
          );

          console.log(
            `Trip driver: ${trip.driverId}`
          );

          console.log(
            `Authenticated driver: ${driverId}`
          );

          socket.emit(
            "tracking:error",
            {
              message:
                "Driver is not assigned to this trip.",
            }
          );

          return;
        }

        /*
        |--------------------------------------------------------------------------
        | Verify Trip Is Still Tracking
        |--------------------------------------------------------------------------
        */

        if (
          trip.status !== "tracking"
        ) {
          socket.emit(
            "tracking:error",
            {
              message:
                "This trip is no longer active.",
            }
          );

          return;
        }

        /*
        |--------------------------------------------------------------------------
        | Update Location
        |--------------------------------------------------------------------------
        */

        const updatedAt =
          new Date().toISOString();

        trip.currentLocation = {
          latitude,
          longitude,

          accuracy:
            typeof accuracy ===
            "number"
              ? accuracy
              : null,

          updatedAt,
        };

        await trip.save();

        console.log(
          `📍 ${tripId} → ${latitude}, ${longitude}`
        );

        /*
        |--------------------------------------------------------------------------
        | Send Location To Trip Room
        |--------------------------------------------------------------------------
        */

        io.to(
          `trip:${tripId}`
        ).emit(
          "driver:locationUpdated",
          {
            tripId,
            driverId,
            latitude,
            longitude,

            accuracy:
              typeof accuracy ===
              "number"
                ? accuracy
                : null,

            updatedAt,
          }
        );
      } catch (error) {
        console.error(
          "❌ Location update error:",
          error
        );

        socket.emit(
          "tracking:error",
          {
            message:
              "Could not update location.",
          }
        );
      }
    }
  );

  /*
  |--------------------------------------------------------------------------
  | CUSTOMER WATCHES A TRIP
  |--------------------------------------------------------------------------
  */

  socket.on(
    "customer:watchTrip",
    async ({ tripId }) => {
      try {
        if (!tripId) {
          socket.emit(
            "tracking:error",
            {
              message:
                "tripId is required.",
            }
          );

          return;
        }

        /*
        |--------------------------------------------------------------------------
        | Normalize Trip ID
        |--------------------------------------------------------------------------
        */

        const cleanTripId =
          tripId
            .trim()
            .toUpperCase();

        /*
        |--------------------------------------------------------------------------
        | Find Trip
        |--------------------------------------------------------------------------
        */

        const trip =
          await Trip.findOne({
            tripId: cleanTripId,
          });

        if (!trip) {
          socket.emit(
            "tracking:error",
            {
              message:
                "Trip not found.",
            }
          );

          return;
        }

        /*
        |--------------------------------------------------------------------------
        | Join Trip Room
        |--------------------------------------------------------------------------
        */

        socket.join(
          `trip:${cleanTripId}`
        );

        console.log(
          `👤 Customer ${socket.id} watching ${cleanTripId}`
        );

        /*
        |--------------------------------------------------------------------------
        | Send Current Location Immediately
        |--------------------------------------------------------------------------
        */

        if (
          trip.currentLocation
        ) {
          socket.emit(
            "driver:currentLocation",
            {
              tripId:
                trip.tripId,

              driverId:
                trip.driverId,

              latitude:
                trip
                  .currentLocation
                  .latitude,

              longitude:
                trip
                  .currentLocation
                  .longitude,

              accuracy:
                trip
                  .currentLocation
                  .accuracy,

              updatedAt:
                trip
                  .currentLocation
                  .updatedAt,
            }
          );
        }
      } catch (error) {
        console.error(
          "❌ Customer tracking error:",
          error
        );

        socket.emit(
          "tracking:error",
          {
            message:
              "Could not watch trip.",
          }
        );
      }
    }
  );

  /*
  |--------------------------------------------------------------------------
  | DRIVER STOPS TRACKING
  |--------------------------------------------------------------------------
  */

  socket.on(
    "driver:stopTracking",
    async ({ tripId }) => {
      try {
        /*
        |--------------------------------------------------------------------------
        | Driver authentication
        |--------------------------------------------------------------------------
        */

        if (!socket.user) {
          socket.emit(
            "tracking:error",
            {
              message:
                "Driver authentication required.",
            }
          );

          return;
        }

        /*
        |--------------------------------------------------------------------------
        | Driver ID comes from JWT
        |--------------------------------------------------------------------------
        */

        const driverId =
          socket.user.driverId;

        if (!driverId) {
          socket.emit(
            "tracking:error",
            {
              message:
                "Driver identity not found.",
            }
          );

          return;
        }

        if (!tripId) {
          socket.emit(
            "tracking:error",
            {
              message:
                "tripId is required.",
            }
          );

          return;
        }

        /*
        |--------------------------------------------------------------------------
        | Find Trip
        |--------------------------------------------------------------------------
        */

        const trip =
          await Trip.findOne({
            tripId,
          });

        if (!trip) {
          socket.emit(
            "tracking:error",
            {
              message:
                "Trip not found.",
            }
          );

          return;
        }

        /*
        |--------------------------------------------------------------------------
        | Verify Driver Owns Trip
        |--------------------------------------------------------------------------
        */

        if (
          trip.driverId !== driverId
        ) {
          socket.emit(
            "tracking:error",
            {
              message:
                "Driver is not assigned to this trip.",
            }
          );

          return;
        }

        /*
        |--------------------------------------------------------------------------
        | Complete Trip
        |--------------------------------------------------------------------------
        */

        trip.status =
          "completed";

        await trip.save();

        /*
        |--------------------------------------------------------------------------
        | Notify Customers BEFORE Driver Leaves
        |--------------------------------------------------------------------------
        */

        io.to(
          `trip:${tripId}`
        ).emit(
          "driver:trackingStopped",
          {
            tripId,
            driverId,
            message:
              "Driver stopped tracking.",
          }
        );

        /*
        |--------------------------------------------------------------------------
        | Driver leaves room
        |--------------------------------------------------------------------------
        */

        socket.leave(
          `trip:${tripId}`
        );

        console.log(
          `🛑 Driver ${driverId} stopped tracking ${tripId}`
        );
      } catch (error) {
        console.error(
          "❌ Stop tracking error:",
          error
        );
      }
    }
  );

  /*
  |--------------------------------------------------------------------------
  | DISCONNECT
  |--------------------------------------------------------------------------
  */

  socket.on(
    "disconnect",
    (reason) => {
      if (socket.user) {
        console.log(
          `🔴 Driver disconnected: ${socket.user.driverId}`,
          reason
        );
      } else {
        console.log(
          `🔴 Customer disconnected: ${socket.id}`,
          reason
        );
      }
    }
  );
});

/*
|--------------------------------------------------------------------------
| BASIC API ROUTE
|--------------------------------------------------------------------------
*/

app.get("/", (req, res) => {
  res.json({
    message:
      "Driver Tracking API is running",
    status: "success",
  });
});

/*
|--------------------------------------------------------------------------
| TRIP ROUTES
|--------------------------------------------------------------------------
*/

app.use(
  "/api/trips",
  tripRoutes
);

/*
|--------------------------------------------------------------------------
| START SERVER
|--------------------------------------------------------------------------
*/

const PORT =
  process.env.PORT || 5000;

const startServer = async () => {
  try {
    /*
    |--------------------------------------------------------------------------
    | MongoDB
    |--------------------------------------------------------------------------
    */

    await connectDatabase();

    console.log(
      "✅ MongoDB connected"
    );

    /*
    |--------------------------------------------------------------------------
    | HTTP + Socket.IO
    |--------------------------------------------------------------------------
    */

    server.listen(
      PORT,
      "0.0.0.0",
      () => {
        console.log(
          `🚀 Server running on port ${PORT}`
        );
      }
    );
  } catch (error) {
    console.error(
      "❌ Failed to start server:",
      error
    );

    process.exit(1);
  }
};

startServer();