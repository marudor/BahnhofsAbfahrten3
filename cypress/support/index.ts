import './commands';

Cypress.Server.defaults({
  force404: true,
});
beforeEach(() => {
  cy.server();
});

Cypress.on('window:before:load', (win) => {
  // @ts-expect-error
  delete win.fetch;
});
