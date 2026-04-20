/* global PaymentSession */
(function () {
  window.WebxpayTokenizeInit = function WebxpayTokenizeInit(config) {
    var card = (config && config.card) || {};
    var ready = (config && config.ready) || function () {};
    var started = false;
    var pendingRequest = null;

    function getErrorMap(update) {
      var fieldErrors = {};
      if (!update || !update.errors || !Array.isArray(update.errors.error)) return fieldErrors;
      update.errors.error.forEach(function (entry) {
        if (!entry || !entry.field || !entry.cause) return;
        fieldErrors[entry.field] = entry.cause;
      });
      return fieldErrors;
    }

    function configure() {
      if (!window.PaymentSession || typeof window.PaymentSession.configure !== "function") {
        throw new Error("MPGS PaymentSession not loaded.");
      }

      window.PaymentSession.configure({
        // Required by MPGS v82+ (must be a non-empty array).
        frameEmbeddingMitigation: ["javascript", "x-frame-options", "csp"],
        fields: {
          card: {
            // MPGS accepts CSS selectors here (e.g. "#card-number").
            number: card.number,
            securityCode: card.securityCode,
            expiryMonth: card.expiryMonth,
            expiryYear: card.expiryYear,
            nameOnCard: card.nameOnCard,
          },
        },
        callbacks: {
          initialized: function () {
            if (started) return;
            started = true;
            ready(function generateSession(onSuccess, onError) {
              if (pendingRequest && pendingRequest.timerId) {
                window.clearTimeout(pendingRequest.timerId);
              }

              pendingRequest = {
                onSuccess: onSuccess,
                onError: onError,
                timerId: window.setTimeout(function () {
                  if (!pendingRequest) return;
                  var cb = pendingRequest.onError;
                  pendingRequest = null;
                  cb({ code: "request_timeout", message: "Timed out while generating card session." });
                }, 15000),
              };

              window.PaymentSession.updateSessionFromForm("card");
            });
          },
          formSessionUpdate: function (update) {
            if (!pendingRequest) return;
            if (pendingRequest.timerId) {
              window.clearTimeout(pendingRequest.timerId);
            }

            var onSuccess = pendingRequest.onSuccess;
            var onError = pendingRequest.onError;
            pendingRequest = null;

            var status = update && update.status;
            if (status === "ok" && update.session && update.session.id) {
              onSuccess(update.session.id);
              return;
            }
            if (status === "fields_in_error") {
              onError({
                code: "invalid_card",
                message: "Please correct the highlighted card fields.",
                fields: getErrorMap(update),
              });
              return;
            }
            if (status === "request_timeout") {
              onError({ code: "request_timeout", message: "Timed out while generating card session." });
              return;
            }
            if (status === "system_error") {
              onError({ code: "system_error", message: "Payment provider is temporarily unavailable." });
              return;
            }

            onError({
              code: "authentication_failed",
              message: "Unable to initialize secure card session.",
            });
          },
        },
        interaction: {
          displayControl: {
            invalidFieldCharacters: "REJECT",
          },
        },
      });
    }

    configure();
  };
})();
