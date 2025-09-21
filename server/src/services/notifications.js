const config = require('../config');

let nodemailer = null;
try {
  nodemailer = require('nodemailer');
} catch (err) {
  nodemailer = null;
}

let cachedTransport = null;

function getEmailConfig() {
  return config.notifications?.email;
}

function hasEmailTransportConfig(emailConfig) {
  return (
    !!emailConfig?.transport?.host &&
    !!emailConfig.transport.port &&
    !!emailConfig.transport.user &&
    !!emailConfig.transport.pass &&
    !!emailConfig.from
  );
}

async function getTransport(emailConfig) {
  if (!nodemailer) {
    return null;
  }
  if (!emailConfig || !emailConfig.enabled) {
    return null;
  }
  if (!hasEmailTransportConfig(emailConfig)) {
    return null;
  }
  if (cachedTransport) {
    return cachedTransport;
  }
  cachedTransport = nodemailer.createTransport({
    host: emailConfig.transport.host,
    port: Number.parseInt(emailConfig.transport.port, 10),
    secure: emailConfig.transport.secure === true,
    auth: {
      user: emailConfig.transport.user,
      pass: emailConfig.transport.pass,
    },
  });
  return cachedTransport;
}

function formatRideDetails(ride) {
  if (!ride) return {};
  if (typeof ride.toJSON === 'function') {
    return ride.toJSON();
  }
  return ride;
}

function formatRequestDetails(request) {
  if (!request) return {};
  if (typeof request.toJSON === 'function') {
    return request.toJSON();
  }
  return request;
}

async function notifySeatRequestStatusChange({ ride, request }) {
  const emailConfig = getEmailConfig();
  if (!emailConfig?.enabled) {
    return;
  }

  const transport = await getTransport(emailConfig);
  if (!transport) {
    return;
  }

  const requestData = formatRequestDetails(request);
  const rideData = formatRideDetails(ride);

  const passengerEmail = requestData.passenger?.email || requestData.passengerEmail || requestData.passengerId;
  if (!passengerEmail || !requestData.passenger?.email) {
    return;
  }

  const subject = `Your seat request was ${requestData.status}`;
  const messageLines = [
    `Hi ${requestData.passenger?.name || 'there'},`,
    '',
    `Your seat request for the ride from ${rideData.from} to ${rideData.to} on ${new Date(
      rideData.date
    ).toLocaleString()} was ${requestData.status}.`,
    `Seats requested: ${requestData.seats}.`,
  ];

  if (requestData.status === 'approved') {
    messageLines.push('', 'The driver has approved your request. Please coordinate final details.');
  } else if (requestData.status === 'rejected') {
    messageLines.push('', 'Unfortunately, the driver was not able to accommodate your request this time.');
  }

  messageLines.push('', 'Thanks for using Carpool!');

  const text = messageLines.join('\n');

  await transport.sendMail({
    from: emailConfig.from,
    to: requestData.passenger.email,
    subject,
    text,
  });
}

module.exports = {
  notifySeatRequestStatusChange,
};
