const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'client/src/app/components/home.component.ts');
let text = fs.readFileSync(filePath, 'utf8');

if (!text.includes('toggleConversation(')) {
  const regex = /  scrollToResults\(\) \{[\s\S]*?\n  \}\n\n/;
  const match = text.match(regex);
  if (!match) {
    throw new Error('scrollToResults block not found');
  }
  const original = match[0];
  const block = "  canShowPassengerConversation(ride: Ride): boolean {\n    if (!this.auth.isAuthenticated()) {\n      return false;\n    }\n    if (!ride?.myRequest) {\n      return false;\n    }\n    return ride.myRequest.status !== 'rejected';\n  }\n\n  canShowDriverConversation(ride: DriverRide): boolean {\n    if (!Array.isArray(ride?.requests)) {\n      return false;\n    }\n    return ride.requests.some((request) => request && request.status !== 'rejected');\n  }\n\n  isConversationOpen(rideId: string): boolean {\n    return !!this.openConversations[rideId];\n  }\n\n  toggleConversation(rideId: string) {\n    if (!rideId) {\n      return;\n    }\n    const nextState = !this.isConversationOpen(rideId);\n    this.openConversations[rideId] = nextState;\n    if (nextState) {\n      this.messageSendMessage[rideId] = '';\n      if (this.messageSendStatus[rideId] === 'error') {\n        delete this.messageSendStatus[rideId];\n      }\n      this.loadRideMessages(rideId);\n    }\n  }\n\n  refreshConversation(rideId: string) {\n    this.loadRideMessages(rideId, true);\n  }\n\n  sendMessage(rideId: string) {\n    if (!rideId) {\n      return;\n    }\n    const draft = (this.messageDraft[rideId] ?? '').trim();\n    if (!draft) {\n      this.messageSendStatus[rideId] = 'error';\n      this.messageSendMessage[rideId] = 'Enter a message before sending.';\n      return;\n    }\n    if (this.messageSendStatus[rideId] === 'loading') {\n      return;\n    }\n\n    this.messageSendStatus[rideId] = 'loading';\n    this.messageSendMessage[rideId] = '';\n\n    this.api.sendRideMessage(rideId, draft).subscribe({\n      next: (message) => {\n        this.messageDraft[rideId] = '';\n        this.messageSendStatus[rideId] = 'success';\n        this.messageSendMessage[rideId] = '';\n        this.appendRideMessage(rideId, message);\n        setTimeout(() => {\n          if (this.messageSendStatus[rideId] === 'success') {\n            delete this.messageSendStatus[rideId];\n          }\n        }, 2000);\n      },\n      error: (err) => {\n        this.messageSendStatus[rideId] = 'error';\n        this.messageSendMessage[rideId] =\n          (err?.error && typeof err.error.error === 'string' && err.error.error) ||\n          'Failed to send message';\n      },\n    });\n  }\n\n  trackMessage(index: number, message: RideMessage) {\n    return message?.id ?? index;\n  }\n\n";
  text = text.replace(regex, original + block);
  fs.writeFileSync(filePath, text);
}
