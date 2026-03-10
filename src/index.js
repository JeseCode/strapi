'use strict';

let automationInterval = null;
let automationTickInFlight = false;

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/*{ strapi }*/) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }) {
    if (automationInterval) {
      clearInterval(automationInterval);
    }

    const automationService = strapi.service(
      "api::automatizacion-whatsapp.automatizacion-whatsapp",
    );

    const runTick = async () => {
      if (automationTickInFlight) {
        return;
      }

      automationTickInFlight = true;

      try {
        await automationService.runAutomationTick();
      } catch (error) {
        strapi.log.error("Error ejecutando tick de automatización WhatsApp", error);
      } finally {
        automationTickInFlight = false;
      }
    };

    automationInterval = setInterval(runTick, 60 * 1000);
    setTimeout(runTick, 5 * 1000);
  },
};
