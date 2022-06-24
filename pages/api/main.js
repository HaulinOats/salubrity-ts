import mongoose from "mongoose";
const uniqueValidator = require("mongoose-unique-validator");
import { seedData } from "../../util/seed";

//Mongoose
const Schema = mongoose.Schema;
mongoose.connect(
  "mongodb+srv://brett84c:lisa8484@salubrity.g3i1r.mongodb.net/salubrity?retryWrites=true&w=majority",
  {
    // useFindAndModify: false,
    // useNewUrlParser: true,
    autoIndex: false,
  }
);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
  console.log("db connected");
});

const userSchema = new Schema({
  fullname: { type: String, lowercase: true },
  username: { type: String, lowercase: true, unique: true },
  userId: { type: Number, index: true, unique: true },
  password: { type: String, lowercase: true },
  role: { type: String, default: "user", lowercase: true },
  isAvailable: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
});
userSchema.plugin(uniqueValidator, {
  message: `Could not insert user based on unique constraint: {PATH} {VALUE} {TYPE}`,
});
const User = mongoose.models.User || mongoose.model("User", userSchema);

const callSchema = new Schema(
  {
    addComments: { type: String, default: null },
    completedAt: { type: Date, default: null, index: true },
    completedBy: { type: Number, default: null },
    contact: { type: String, default: null },
    createdAt: { type: Date, default: Date.now() },
    createdBy: { type: Date, default: null },
    customJob: { type: String, default: null },
    dob: { type: Date, default: null },
    dressingChangeDate: { type: Date, default: null },
    hospital: { type: Number, default: null },
    referenceCallId: { type: String, default: null },
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
callSchema.plugin(uniqueValidator, {
  message: `Could not insert call based on unique constraint: {PATH} {VALUE} {TYPE}`,
});
const Call = mongoose.models.Call || mongoose.model("Call", callSchema);

const itemSchema = new Schema({
  itemId: { type: Number, index: true, unique: true, required: true },
  procedureName: { type: String, required: true },
  procedureId: { type: Number, required: true },
  groupName: { type: String, required: true },
  fieldName: { type: String, default: null },
  value: { type: String, default: null },
  isCustom: { type: Boolean, required: true },
  fieldAbbr: String,
  valuePrefix: String,
  valueSuffix: String,
});
itemSchema.plugin(uniqueValidator, {
  message: "Could not insert item on unique constraint: {PATH} {VALUE} {TYPE}",
});
const Item = mongoose.models.Item || mongoose.model("Item", itemSchema);

const procedureSchema = new Schema({
  procedureId: { type: Number, index: true, unique: true },
  name: { type: String, required: true },
  seq: { type: Number, required: true },
  groups: [
    {
      seq: Number,
      groupName: String,
      hideHeader: { type: Boolean, default: false },
      hideGroup: { type: Boolean, default: false },
      fieldName: { type: String },
      inputType: String,
      groupItems: [Number],
    },
  ],
});
procedureSchema.plugin(uniqueValidator, {
  message: `Could not insert procedure based on unique constraint: {PATH} {VALUE} {TYPE}`,
});
const Procedure =
  mongoose.models.Procedure || mongoose.model("Procedure", procedureSchema);

const optionSchema = new Schema({
  optionId: { type: Number, required: true },
  name: String,
  inputType: String,
  callFieldName: { type: String, index: true, unique: true },
  options: {
    type: [Object],
    default: () => {
      return null;
    },
  },
});
optionSchema.plugin(uniqueValidator, {
  message: `Could not insert option based on unique constraint: {PATH} {VALUE} {TYPE}`,
});
const Option = mongoose.models.Option || mongoose.model("Option", optionSchema);

export default async (req, res) => {
  const { path } = req.body;
  console.log(req.body);

  switch (path) {
    case "/add-call":
      Call.create(req.body, (err, call) => {
        if (err) return res.status(200).json(err);
        if (call) {
          return res.status(200).json(call);
        } else {
          return res.status(200).json({ error: "error creating a new call" });
        }
      });
      break;
    case "/delete-call":
      Call.deleteOne(req.body, (err) => {
        if (err) return res.status(200).json(err);
        return res.status(200).json(req.body);
      });
      break;
    case "/get-active-calls":
      Call.find(
        {
          completedAt: null,
          dressingChangeDate: null,
        },
        (err, calls) => {
          if (err) return res.status(200).json(err);
          if (calls) {
            return res.status(200).json(calls);
          } else {
            return res
              .status(200)
              .json({ error: "there are no calls to return" });
          }
        }
      );
      break;
    case "/get-open-call-for-user":
      Call.findById(req.body._id, (err, call) => {
        if (err) return res.status(200).json(err);
        if (call) {
          return res.status(200).json(call);
        } else {
          return res.status(200).json({ error: "no open records for user" });
        }
      });
      break;
    case "/get-open-line-procedures":
      Call.find({
        dressingChangeDate: { $ne: null },
        completedAt: null,
      })
        .sort({ dressingChangeDate: 1 })
        .exec((err, calls) => {
          if (err) return res.status(200).json(err);
          if (calls) {
            return res.status(200).json(calls);
          } else {
            return res.status(200).json({
              error: "there are no open line procedures to return",
            });
          }
        });
      break;
    case "/set-call-as-open":
      Call.findById(req.body._id, (err, call) => {
        if (err) return res.status(200).json(err);
        if (call) {
          if (call.openBy) {
            return res.status(200).json({ error: "call is already open" });
          } else {
            call.openBy = Number(req.body.userId);
            call.startTime = new Date();
            call.save((err2) => {
              if (err2) return res.status(200).json(err2);
              return res.status(200).json(call);
            });
          }
        } else {
          return res
            .status(200)
            .json({ error: "could not find call to set as open" });
        }
      });
      break;
    case "/set-call-as-unopen":
      Call.findById(req.body._id, (err, call) => {
        if (err) return res.status(200).json(err);
        if (call) {
          call.openBy = null;
          call.startTime = null;
          call.save((err2) => {
            if (err2) return res.status(200).json(err2);
            return res.status(200).json(call);
          });
        } else {
          return res
            .status(200)
            .json({ error: "could not find call to set as unopen" });
        }
      });
      break;
    case "/set-as-done-editing":
      Call.findById(req.body._id, (err, call) => {
        console.log(call);
        if (err) return res.status(200).json(err);
        if (call) {
          call.openBy = null;
          call.save((err2) => {
            if (err2) return res.status(200).json(err2);
            return res.status(200).json(call);
          });
        } else {
          return res
            .status(200)
            .json({ error: "could not find call to set as unopen" });
        }
      });
      break;
    case "/procedure-completed":
      Call.findOneAndUpdate(
        { _id: req.body.newCallObj._id },
        { $set: req.body.newCallObj },
        { new: true },
        (err, call) => {
          if (err) return res.status(200).json(err);
          return res.status(200).json(call);
        }
      );
      break;
    case "/get-user-by-id":
      User.findById(req.body._id, (err, user) => {
        if (err) return res.status(200).json(err);
        if (user) {
          let modifiedUser = user;
          modifiedUser.password = undefined;
          return res.status(200).json(modifiedUser);
        } else {
          return res.status(200).json({
            error: "could not find user from id: " + req.body._id,
          });
        }
      });
      break;
    case "/login-user":
      User.findOne(
        { username: req.body.username.toLowerCase() },
        (err, user) => {
          if (err) return res.status(200).json(err);
          if (user) {
            if (user.password === req.body.password) {
              if (req.body.loginType === "user") {
                let loggedUser = user;
                loggedUser.password = undefined;
                return res.status(200).json(loggedUser);
              } else {
                if (user.role === "admin" || user.role === "super") {
                  let loggedUser = user;
                  loggedUser.password = undefined;
                  return res.status(200).json(loggedUser);
                } else {
                  return res.status(200).json({
                    error: "regular users cannot login to admin",
                  });
                }
              }
            } else {
              return res.status(200).json({ error: "incorrect password" });
            }
          } else {
            return res.status(200).json({ error: "user doesn't exist" });
          }
        }
      );
      break;
    case "/get-call-by-id":
      Call.findById({ _id: req.body._id }, (err, call) => {
        if (err) return res.status(200).json(err);
        if (call) {
          if (call.openBy && call.openBy !== req.body.userId) {
            return res.status(200).json({
              isOpen: "Record is already open by:",
              userId: call.openBy,
            });
          } else {
            call.openBy = req.body.userId;
            call.save((err2) => {
              if (err2) return res.status(200).json(err2);
              return res.status(200).json(call);
            });
          }
        } else {
          return res.status(200).json({
            error: "could not find a call with that id" + req.body._id,
          });
        }
      });
      break;
    case "/add-user":
      let newUser = req.body;
      User.find()
        .sort({ userId: -1 })
        .limit(1)
        .exec((err, users) => {
          if (err) return res.status(200).json(err);
          if (users.length) {
            newUser.userId = users[0].userId + 1;
            User.create(newUser, (err2, user) => {
              if (err2) return res.status(200).json(err2);
              return res.status(200).json(user);
            });
          } else {
            return res.status(200).json({ error: "error adding new user" });
          }
        });
      break;
    case "/toggle-user-is-active":
      User.findById(req.body._id, (err, user) => {
        if (err) return res.status(200).json(err);
        if (user) {
          user.isActive = !user.isActive;
          user.save((err2) => {
            if (err2) return res.status(200).json(err2);
            return res.status(200).json(user);
          });
        } else {
          return res.status(200).json({ error: "Could not find that user" });
        }
      });
      break;
    case "/get-all-users":
      User.find()
        .sort({ userId: 1 })
        .exec((err, users) => {
          if (err) return res.status(200).json(err);
          users.forEach((user, idx) => {
            users[idx].password = undefined;
          });
          return res.status(200).json(users);
        });
      break;
    case "/admin-get-all-users":
      User.find()
        .sort({ userId: -1 })
        .exec((err, users) => {
          if (err) return res.status(200).json(err);
          users.forEach((user, idx) => {
            if (user.role !== "user") {
              users[idx].password = undefined;
            }
          });
          return res.status(200).json(users);
        });
      break;
    case "/get-procedures":
      Procedure.find()
        .sort({ seq: 1 })
        .exec((err, procedures) => {
          if (err) return res.status(200).json(err);
          if (procedures.length) {
            return res.status(200).json({
              procedures,
            });
          } else {
            return res
              .status(200)
              .json({ error: "there were no procedures to return" });
          }
        });
      break;
    case "/get-items":
      Item.find()
        .sort({ itemId: 1 })
        .exec((err, items) => {
          if (err) return res.status(200).json(err);
          if (items.length) {
            return res.status(200).json(items);
          } else {
            return res
              .status(200)
              .json({ error: "there were no items to return" });
          }
        });
      break;
    case "/get-options":
      Option.find().exec((err, options) => {
        if (err) return res.status(200).json(err);
        if (options.length) {
          return res.status(200).json(options);
        } else {
          return res
            .status(200)
            .json({ error: "there were no options to return" });
        }
      });
      break;
    case "/get-completed-calls":
      Call.find({
        completedAt: { $gt: new Date(Date.now() - 12 * 60 * 60 * 1000) },
      })
        .sort({ completedAt: -1 })
        .exec((err, calls) => {
          if (err) return res.status(200).json(err);
          if (calls) {
            return res.status(200).json(calls);
          } else {
            return res
              .status(200)
              .json({ error: "no completed calls for today, yet" });
          }
        });
      break;
    case "/get-calls-by-query":
      //normal query
      let queryObj = {
        completedAt: {
          $gte: new Date(req.body.startDate),
          $lt: new Date(req.body.endDate),
        },
      };
      let dataObj = {};

      req.body.filtersArr.forEach((filter) => {
        fieldName = filter[0];
        filterValue = filter[1];
        switch (fieldName) {
          case "insertionType":
            queryObj["itemIds"] = { $in: [Number(filterValue)] };
            break;
          case "procedureId":
            let fValue = Number(filterValue);
            if (fValue === 1 || fValue === 10) {
              queryObj["procedureIds"] = { $in: [1, 10] };
            } else {
              queryObj["procedureIds"] = Number(filterValue);
            }
            break;
          case "insertedBy":
            queryObj["insertedBy"] = { $ne: null };
            break;
          case "hospital":
            if (filterValue.toLowerCase() === "erlanger") {
              queryObj["hospital"] = { $in: [1, 2, 3, 4, 5] };
            } else {
              queryObj["hospital"] = Number(filterValue);
            }
            break;
          case "patientName":
            //if search criteria too small, stresses database too much
            if (filterValue.length > 5) {
              queryObj["patientName"] = { $regex: filterValue };
            }
            break;
          default:
            queryObj[fieldName] = filterValue;
        }
      });

      Call.find(queryObj, (err, calls) => {
        if (err) return res.status(200).json(err);
        dataObj.calls = calls;
        Call.aggregate([
          { $match: queryObj },
          { $project: { itemIds: 1, _id: 0 } },
          { $unwind: "$itemIds" },
          { $group: { _id: "$itemIds", count: { $sum: 1 } } },
        ]).exec((err2, agg) => {
          if (err2) return res.status(200).json(err2);
          dataObj.aggregation = agg;
          return res.status(200).json(dataObj);
        });
      });
      break;
    case "/get-calls-by-date-range":
      Call.find(
        {
          completedAt: {
            $gte: new Date(req.body.startDate),
            $lt: new Date(req.body.endDate),
          },
        },
        (err, calls) => {
          if (err) return res.status(200).json(err);
          return res.status(200).json(calls);
        }
      );
      break;
    case "/calls-containing-value":
      Call.find(
        {
          completedAt: {
            $gte: new Date(req.body.dateQuery.startDate),
            $lt: new Date(req.body.dateQuery.endDate),
          },
          [req.body.query.key]: {
            $regex: req.body.query.value,
          },
        },
        (err, calls) => {
          if (err) return res.status(200).json(err);
          if (calls.length) {
            return res.status(200).json(calls);
          } else {
            return res.status(200).json({
              error: `no calls returned for this query: ${req.body.query.key} = ${req.body.query.value}`,
            });
          }
        }
      );
      break;
    case "/calls-by-single-criteria":
      Call.find(
        {
          completedAt: {
            $gte: new Date(req.body.dateQuery.startDate),
            $lt: new Date(req.body.dateQuery.endDate),
          },
          [req.body.query.key]: req.body.query.value,
        },
        (err, calls) => {
          if (err) return res.status(200).json(err);
          if (calls.length) {
            return res.status(200).json(calls);
          } else {
            return res.status(200).json({
              error: `no calls returned for this query: ${req.body.query.key} = ${req.body.query.value}`,
            });
          }
        }
      );
      break;
    case "/sort-by-field":
      Call.find()
        .sort(req.body)
        .exec((err, calls) => {
          if (err) return res.status(200).json(err);
          if (calls) {
            return res.status(200).json(calls);
          } else {
            return res
              .status(200)
              .json({ error: "not calls match that criteria" });
          }
        });
      break;
    case "/add-hospital":
      Option.findById({ callFieldName: "hospital" }, (err, hospitals) => {
        if (err) return res.status(200).json(err);
        if (hospitals) {
          hospitals.options.push({
            id: hospitals.options.length + 1,
            name: req.body.hospitalName,
          });
          hospitals.save((err2) => {
            if (err2) return res.status(200).json(err2);
            return res.status(200).json(hospitals);
          });
        } else {
          return res.status(200).json({ error: "error getting hospital data" });
        }
      });
      break;
    case "/add-order-change":
      Option.findById({ callFieldName: "orderChange" }, (err, orderChanges) => {
        if (err) return res.status(200).json(err);
        if (orderChanges) {
          orderChanges.options.push({
            id: orderChanges.options.length + 1,
            name: req.body.orderChangeName,
          });
          orderChanges.save((err2) => {
            if (err2) return res.status(200).json(err2);
            return res.status(200).json(orderChanges);
          });
        } else {
          return res
            .status(200)
            .json({ error: "error getting order change data" });
        }
      });
      break;
    case "/add-need-option":
      Option.findById({ callFieldName: "callNeeds" }, (err, needs) => {
        if (err) return res.status(200).json(err);
        if (needs) {
          needs.options.push({
            id: needs.options.length + 1,
            name: req.body.addNeedName,
          });
          needs.save((err2) => {
            if (err2) return res.status(200).json(err2);
            return res.status(200).json(needs);
          });
        } else {
          return res
            .status(200)
            .json({ error: "error getting order change data" });
        }
      });
      break;
    case "/get-open-calls-in-range":
      Call.find(
        {
          startTime: {
            $gte: new Date(req.body.startDate),
            $lt: new Date(req.body.endDate),
          },
          openBy: {
            $ne: null,
          },
        },
        (err, calls) => {
          if (err) return res.status(200).json(err);
          if (calls) {
            return res.status(200).json(calls);
          } else {
            return res.status(200).json({
              error: "no open calls exist within that date query",
            });
          }
        }
      );
      break;
    case "/get-order-changes-in-range":
      Call.find(
        {
          startTime: {
            $gte: new Date(req.body.startDate),
            $lt: new Date(req.body.endDate),
          },
          orderChange: { $ne: null },
        },
        (err, calls) => {
          if (err) return res.status(200).json(err);
          if (calls) {
            return res.status(200).json(calls);
          } else {
            return res.status(200).json({
              error: "no order changes happened within that date range",
            });
          }
        }
      );
      break;
    case "/save-call":
      Call.replaceOne({ _id: req.body._id }, req.body, (err) => {
        if (err) return res.status(200).json(err);
        return res.status(200).json(true);
      });
      break;
    case "/get-insertion-types-aggregation":
      Call.aggregate([
        {
          $match: {
            completedAt: {
              $gte: new Date(req.body.completedAt.startDate),
              $lte: new Date(req.body.completedAt.endDate),
            },
          },
        },
        { $project: { itemIds: 1, _id: 0 } },
        { $unwind: "$itemIds" },
        { $group: { _id: "$itemIds", count: { $sum: 1 } } },
      ]).exec((err, calls) => {
        if (err) return res.status(200).json(err);
        return res.status(200).json(calls);
      });
      break;
    case "/get-hospitals-aggregation":
      Call.aggregate(
        [
          {
            $match: {
              completedAt: {
                $gte: new Date(req.body.completedAt.startDate),
                $lte: new Date(req.body.completedAt.endDate),
              },
            },
          },
          { $group: { _id: "$hospital", count: { $sum: 1 } } },
        ],
        (err, calls) => {
          if (err) return res.status(200).json(err);
          return res.status(200).json(calls);
        }
      );
      break;
    case "/admin-update-user-data":
      User.findOneAndUpdate(
        { _id: req.body._id },
        {
          $set: {
            [req.body.field]: req.body.value,
          },
        },
        (err, user) => {
          if (err) return res.status(200).json(err);
          return res.status(200).json(user);
        }
      );
      break;
    case "/toggle-user-availability":
      User.findById({ _id: req.body._id }, (err, user) => {
        if (err) return res.status(200).json(err);
        user.isAvailable = !user.isAvailable;
        user.save((err2, updateUser) => {
          if (err2) return res.status(200).json(err2);
          updateUser.password = undefined;
          return res.status(200).json(updateUser);
        });
      });
      break;
    case "/get-online-users":
      User.find({ isAvailable: true }, (err, users) => {
        if (err) return res.status(200).json(err);
        let onlineUsers = [];
        users.forEach((user) => {
          onlineUsers.push(user.fullname);
        });
        return res.status(200).json(onlineUsers);
      });
      break;
    case "/update-admin-password":
      User.findById({ username: req.body.username }, (err, user) => {
        if (err) return res.status(200).json(err);
        if (user.password === req.body.password) {
          user.password = req.body.newPassword;
          user.save((err2) => {
            if (err2) return res.status(200).json(err2);
            return res.status(200).json(user);
          });
        } else {
          return res
            .status(200)
            .json({ error: "incorrect password for that admin user" });
        }
      });
      break;
    case "/seed-procedures":
      Procedure.insertMany(
        seedData.procedureSeed,
        { ordered: false },
        (err, procedures) => {
          if (err) return res.status(200).json(err);
          if (procedures) {
            return res.status(200).json(procedures);
          } else {
            return res.status(200).json({ error: "no procedures exist" });
          }
        }
      );
      break;
    case "/seed-options":
      Option.insertMany(
        seedData.optionSeed,
        { ordered: false },
        (err, options) => {
          if (err) return res.status(200).json(err);
          if (options) {
            return res.status(200).json(options);
          } else {
            return res.status(200).json({ error: "no options exist" });
          }
        }
      );
      break;
    case "/seed-items":
      Item.insertMany(seedData.itemSeed, { ordered: false }, (err, items) => {
        if (err) return res.status(200).json({ error: err });
        if (items) {
          return res.status(200).json(items);
        } else {
          return res.status(200).json({ error: "no items exist" });
        }
      });
      break;
  }
};
