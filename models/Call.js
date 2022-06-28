import { Schema, model, models } from "mongoose";

const callSchema = new Schema(
  {
    addComments: { type: String, default: null },
    completedAt: { type: Date, default: null, index: true },
    completedBy: { type: Number, default: null },
    contact: { type: String, default: null },
    createdAt: { type: Date, default: Date.now() },
    createdBy: { type: Number, default: null },
    customJob: { type: String, default: null },
    dob: { type: Date, default: null },
    dressingChangeDate: { type: Date, default: null },
    hospital: { type: Number, default: null },
    insertedBy: { type: String, default: null },
    insertionLength: { type: Number, default: 0 },
    itemIds: { type: Array, default: null },
    job: { type: String, default: null },
    mrn: { type: Number, default: null },
    openBy: { type: Number, default: null },
    orderChange: { type: Number, default: null },
    patientName: { type: String, default: null, lowercase: true },
    preComments: { type: String, default: null },
    procedureIds: { type: Array, default: null },
    proceduresDone: [Object],
    procedureTime: { type: Number, default: null },
    provider: { type: String, lowercase: true },
    responseTime: { type: Number, default: null },
    room: { type: String, default: null, lowercase: true },
    startTime: { type: Date, default: null },
    status: { type: Number, default: 1 },
    updatedAt: { type: Date, default: null },
    updatedBy: { type: Number, default: null },
    wasConsultation: { type: Boolean, default: false },
  },
  {
    versionKey: false,
  }
);

const Call = models.Call || model("Call", callSchema);

export default Call;
