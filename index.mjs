import Koa from "koa";
import Router from "@koa/router";
import jwt from "jsonwebtoken";
import { bodyParser } from "@koa/bodyparser";
import logger from "koa-logger";
import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import { stripUrlQueryAndFragment } from "@sentry/utils";
import cors from "@koa/cors";

const port = process.env.PORT || 8000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const RIGHT_EMAIL = "linustorvalds@gmail.com";
const RIGHT_PASSWORD = "ilovecats";
const API_TOKEN =
  "26df07b5b7318455b8ca09f923eaae6de6eb95530743eddcfdb541df9487df9d";

const key = "ilovecats";

const app = new Koa();
/*
Sentry.init({
  dsn: "https://017c3d1e30d3c2515a53e28cf56950b8@o4507120577740800.ingest.de.sentry.io/4507121230217296",

  // We recommend adjusting this value in production, or using tracesSampler
  // for finer control
  tracesSampleRate: 1.0,

  integrations: [
    // Automatically instrument Node.js libraries and frameworks
    ...Sentry.autoDiscoverNodePerformanceMonitoringIntegrations(),
    nodeProfilingIntegration(),
  ],
});

// usual error handler
app.on("error", (err, ctx) => {
  Sentry.withScope((scope) => {
    scope.addEventProcessor((event) => {
      return Sentry.addRequestDataToEvent(event, ctx.request);
    });
    Sentry.captureException(err);
  });
});*/

app.use(cors());
app.use(bodyParser());
app.use(logger());

const router = new Router();

router
  .post("/api/users/login", async (context) => {
    const body = context.request.body;
    const result = body;

    if (!result.password) {
      context.response.body = {
        status: "error",
        code: "missing_password_field",
      };
      context.response.status = 400;
      return;
    }

    if (!result.email) {
      context.response.body = {
        status: "error",
        code: "missing_email_field",
      };
      context.response.status = 400;
      return;
    }

    const randomMiliseconds = Math.floor(Math.random() * 1000) + 1000;

    await sleep(randomMiliseconds);

    if (result.email.match('";')) {
      throw new Error("SQL Injection x.x");
    }

    if (result.email === RIGHT_EMAIL && result.password === RIGHT_PASSWORD) {
      const token = jwt.sign(
        {
          userId: "ef8b5230-b118-4b6c-8318-33bca35d0e44",
          email: RIGHT_EMAIL,
        },
        key,
        { expiresIn: "1 day" }
      );

      context.response.body = {
        status: "sucess",
        payload: {
          jwt: token,
        },
      };
      context.response.status = 200;
      return;
    }

    context.response.body = {
      status: "error",
      code: "wrong_email_or_password",
    };
    context.response.status = 401;
  })
  .get("/api/recepies", async (context) => {
    const token = context.request.header["authorization"];

    const apiToken = context.request.header["api_token"];

    console.log(token, apiToken);

    if (apiToken != null) {
      if (apiToken !== API_TOKEN) {
        context.response.body = {
          status: "error",
          code: "invalid_api_token",
        };
        context.response.status = 401;
        return;
      }

      context.response.body = {
        status: "sucess",
        payload: [
          {
            id: "e386ba6d-b9a3-4b64-a374-f9952fa09938",
            name: "Pizza",
            ingredients: ["cheese", "tomato", "dough"],
          },
          {
            id: "99de4b25-0fe1-47a0-86f1-18cef3b908a9",
            name: "Pasta",
            ingredients: ["pasta", "tomato", "cheese"],
          },
        ],
      };
      context.response.status = 200;

      return;
    }

    console.log(apiToken);

    if (!token) {
      context.response.body = {
        status: "error",
        code: "missing_authorization_header",
      };
      context.response.status = 401;
      return;
    }

    const [_, jwtBase64] = token.split(" ");

    try {
      jwt.verify(jwtBase64, key);
    } catch (error) {
      console.error(error);
      context.response.body = {
        status: "error",
        code: "invalid_jwt",
      };
      context.response.status = 401;
      return;
    }

    context.response.body = {
      status: "sucess",
      payload: [
        {
          id: "e386ba6d-b9a3-4b64-a374-f9952fa09938",
          name: "Pizza",
          ingredients: ["cheese", "tomato", "dough"],
        },
        {
          id: "99de4b25-0fe1-47a0-86f1-18cef3b908a9",
          name: "Pasta",
          ingredients: ["pasta", "tomato", "cheese"],
        },
      ],
    };
    context.response.status = 200;
  });

app.use(router.routes()).use(router.allowedMethods());

app.listen(port);
