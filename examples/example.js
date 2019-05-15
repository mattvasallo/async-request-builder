const arb = require('../index');
const fs = require('fs');
const jsBeautify = require('js-beautify').js;


const exampleRequestDefinitionJSON = {
    "nodeHTTPGET": {
        "asyncModule": "http",
        "operationDetails": {
            "method": "GET",
            "url": "https://httpstat.us/200?sleep=:sleep",
            "headers": {
                "Accept": 'application/json'
            }
        }
    }
};

const test = {
    "paths": {
        "/activities/{courseKey}/{activityId}": {
            "get": {
                "tags": [
                    "activities"
                ],
                "summary": "Get activity for the courseKey and activity id.",
                "description": "",
                "operationId": "getActivity",
                "produces": [
                    "application/json"
                ],
                "parameters": [{
                        "name": "courseKey",
                        "in": "path",
                        "description": "Course key",
                        "required": true,
                        "type": "string"
                    },
                    {
                        "name": "activityId",
                        "in": "path",
                        "description": "Activity id",
                        "required": true,
                        "type": "string"
                    }
                ],
                "responses": {
                    "200": {
                        "description": "successful operation",
                        "schema": {
                            "$ref": "#/definitions/GatewayActivity"
                        }
                    }
                },
                "security": [{
                    "Bearer": []
                }]
            }
        },
        "/activities/{courseKey}": {
            "get": {
                "tags": [
                    "activities"
                ],
                "summary": "Get activities for the courseKey.",
                "description": "",
                "operationId": "getActivities",
                "produces": [
                    "application/json"
                ],
                "parameters": [{
                    "name": "courseKey",
                    "in": "path",
                    "description": "Course key",
                    "required": true,
                    "type": "string"
                }],
                "responses": {
                    "200": {
                        "description": "successful operation",
                        "schema": {
                            "$ref": "#/definitions/GetGatewayActivitiesResponse"
                        }
                    }
                },
                "security": [{
                    "Bearer": []
                }]
            }
        },
        "/activities/{courseKey}/learningPath": {
            "get": {
                "tags": [
                    "activities"
                ],
                "summary": "Get learning path for courseKey for a user.",
                "description": "",
                "operationId": "getLearningPath",
                "produces": [
                    "application/json"
                ],
                "parameters": [{
                    "name": "courseKey",
                    "in": "path",
                    "description": "Course key",
                    "required": true,
                    "type": "string"
                }],
                "responses": {
                    "200": {
                        "description": "successful operation",
                        "schema": {
                            "$ref": "#/definitions/GatewayLearningPathResponse"
                        }
                    }
                },
                "security": [{
                    "Bearer": []
                }]
            }
        },
        "/activities/launchData/{courseKey}/{activityId}": {
            "get": {
                "tags": [
                    "activities"
                ],
                "summary": "Retrieve parameters needed to launch an activity.",
                "description": "",
                "operationId": "getActivityLaunchData",
                "produces": [
                    "application/json"
                ],
                "parameters": [{
                        "name": "courseKey",
                        "in": "path",
                        "description": "Course key",
                        "required": true,
                        "type": "string"
                    },
                    {
                        "name": "activityId",
                        "in": "path",
                        "description": "Activity ID",
                        "required": true,
                        "type": "string"
                    }
                ],
                "responses": {
                    "200": {
                        "description": "successful operation",
                        "schema": {
                            "$ref": "#/definitions/GatewayActivityLaunchData"
                        }
                    }
                },
                "security": [{
                    "Bearer": []
                }]
            }
        },
        "/courses/{courseKey}/instructor/attendances/attendance": {
            "post": {
                "tags": [
                    "attendance"
                ],
                "summary": "Create new attendance",
                "description": "Instructor only",
                "operationId": "createAttendance",
                "consumes": [
                    "application/json"
                ],
                "produces": [
                    "application/json"
                ],
                "parameters": [{
                        "name": "courseKey",
                        "in": "path",
                        "description": "Course key",
                        "required": true,
                        "type": "string"
                    },
                    {
                        "in": "body",
                        "name": "body",
                        "required": false,
                        "schema": {
                            "$ref": "#/definitions/GatewayCreateAttendanceRequest"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "successful operation",
                        "schema": {
                            "$ref": "#/definitions/GatewayAttendance"
                        }
                    }
                },
                "security": [{
                    "Bearer": []
                }]
            }
        },
        "/courses/{courseKey}/instructor/attendances/{attendanceId}": {
            "get": {
                "tags": [
                    "attendance"
                ],
                "summary": "Get attendance result for courseKey and for a specific attendance",
                "description": "Instructor only",
                "operationId": "getAttendanceResult",
                "produces": [
                    "application/json"
                ],
                "parameters": [{
                        "name": "courseKey",
                        "in": "path",
                        "description": "Course key",
                        "required": true,
                        "type": "string"
                    },
                    {
                        "name": "attendanceId",
                        "in": "path",
                        "description": "Attendance Id",
                        "required": true,
                        "type": "integer",
                        "format": "int64"
                    }
                ],
                "responses": {
                    "200": {
                        "description": "successful operation",
                        "schema": {
                            "$ref": "#/definitions/GatewayAttendanceResult"
                        }
                    }
                },
                "security": [{
                    "Bearer": []
                }]
            },
            "delete": {
                "tags": [
                    "attendance"
                ],
                "summary": "Delete specific attendance",
                "description": "",
                "operationId": "deleteAttendance",
                "parameters": [{
                        "name": "courseKey",
                        "in": "path",
                        "description": "Course key",
                        "required": true,
                        "type": "string"
                    },
                    {
                        "name": "attendanceId",
                        "in": "path",
                        "description": "Attendance Id",
                        "required": true,
                        "type": "integer",
                        "format": "int64"
                    }
                ],
                "responses": {
                    "default": {
                        "description": "successful operation"
                    }
                },
                "security": [{
                    "Bearer": []
                }]
            }
        },
        "/courses/{courseKey}/student/attendances": {
            "get": {
                "tags": [
                    "attendance"
                ],
                "summary": "Get student attendance result for courseKey by student",
                "description": "Student only",
                "operationId": "getStudentAttendanceResult",
                "produces": [
                    "application/json"
                ],
                "parameters": [{
                    "name": "courseKey",
                    "in": "path",
                    "description": "Course key",
                    "required": true,
                    "type": "string"
                }],
                "responses": {
                    "200": {
                        "description": "successful operation",
                        "schema": {
                            "$ref": "#/definitions/GatewayStudentAttendanceResult"
                        }
                    }
                },
                "security": [{
                    "Bearer": []
                }]
            }
        },
        "/courses/{courseKey}/instructor/attendances/students/{studentGuid}/bulk": {
            "post": {
                "tags": [
                    "attendance"
                ],
                "summary": "Bulk update attendances for student",
                "description": "Instructor only",
                "operationId": "bulkUpdateStudentForAttendances",
                "consumes": [
                    "application/json"
                ],
                "parameters": [{
                        "name": "courseKey",
                        "in": "path",
                        "description": "Course key",
                        "required": true,
                        "type": "string"
                    },
                    {
                        "name": "studentGuid",
                        "in": "path",
                        "description": "Attendance Id",
                        "required": true,
                        "type": "string"
                    },
                    {
                        "in": "body",
                        "name": "body",
                        "required": false,
                        "schema": {
                            "$ref": "#/definitions/GatewayBulkUpdateAttendanceRequest"
                        }
                    }
                ],
                "responses": {
                    "default": {
                        "description": "successful operation"
                    }
                },
                "security": [{
                    "Bearer": []
                }]
            }
        },
        "/courses/{courseKey}/instructor/attendances": {
            "get": {
                "tags": [
                    "attendance"
                ],
                "summary": "Get attendances report for course",
                "description": "Instructor only",
                "operationId": "getCourseAttendancesReport",
                "produces": [
                    "text/csv"
                ],
                "parameters": [{
                        "name": "courseKey",
                        "in": "path",
                        "description": "Course key",
                        "required": true,
                        "type": "string"
                    },
                    {
                        "name": "dateBefore",
                        "in": "query",
                        "description": "Top limit for attendance date creation",
                        "required": false,
                        "type": "string",
                        "format": "date"
                    },
                    {
                        "name": "dateAfter",
                        "in": "query",
                        "description": "Bottom limit for attendance date creation",
                        "required": false,
                        "type": "string",
                        "format": "date"
                    }
                ],
                "responses": {
                    "200": {
                        "description": "successful operation",
                        "schema": {
                            "$ref": "#/definitions/GatewayStudentAttendanceResponse"
                        }
                    }
                },
                "security": [{
                    "Bearer": []
                }]
            }
        },
        "/courses/{courseKey}/instructor/attendances/students/{studentGuid}": {
            "get": {
                "tags": [
                    "attendance"
                ],
                "summary": "Get student attendance result for courseKey and for a specific student by instructor",
                "description": "Instructor only",
                "operationId": "getStudentAttendanceForInstructorResult",
                "produces": [
                    "application/json"
                ],
                "parameters": [{
                        "name": "courseKey",
                        "in": "path",
                        "description": "Course key",
                        "required": true,
                        "type": "string"
                    },
                    {
                        "name": "studentGuid",
                        "in": "path",
                        "description": "Student guid",
                        "required": true,
                        "type": "string"
                    }
                ],
                "responses": {
                    "200": {
                        "description": "successful operation",
                        "schema": {
                            "$ref": "#/definitions/GatewayStudentAttendanceForInstructorResult"
                        }
                    }
                },
                "security": [{
                    "Bearer": []
                }]
            }
        },
        "/courses/{courseKey}/student/attendances/{attendanceId}/mark/present": {
            "post": {
                "tags": [
                    "attendance"
                ],
                "summary": "Mark student as present",
                "description": "Student only",
                "operationId": "checkIn",
                "parameters": [{
                        "name": "courseKey",
                        "in": "path",
                        "description": "Course key",
                        "required": true,
                        "type": "string"
                    },
                    {
                        "name": "attendanceId",
                        "in": "path",
                        "description": "Attendance Id",
                        "required": true,
                        "type": "integer",
                        "format": "int64"
                    }
                ],
                "responses": {
                    "default": {
                        "description": "successful operation"
                    }
                },
                "security": [{
                    "Bearer": []
                }]
            }
        },
        "/courses/{courseKey}/instructor/attendances/{attendanceId}/bulk": {
            "post": {
                "tags": [
                    "attendance"
                ],
                "summary": "Bulk update students participation for attendance",
                "description": "Instructor only",
                "operationId": "bulkUpdateAttendanceForStudents",
                "consumes": [
                    "application/json"
                ],
                "parameters": [{
                        "name": "courseKey",
                        "in": "path",
                        "description": "Course key",
                        "required": true,
                        "type": "string"
                    },
                    {
                        "name": "attendanceId",
                        "in": "path",
                        "description": "Attendance Id",
                        "required": true,
                        "type": "integer",
                        "format": "int64"
                    },
                    {
                        "in": "body",
                        "name": "body",
                        "required": false,
                        "schema": {
                            "$ref": "#/definitions/GatewayBulkUpdateStudentParticipationRequest"
                        }
                    }
                ],
                "responses": {
                    "default": {
                        "description": "successful operation"
                    }
                },
                "security": [{
                    "Bearer": []
                }]
            }
        },
        "/courses/{courseKey}/instructor/attendances/{attendanceId}/end": {
            "post": {
                "tags": [
                    "attendance"
                ],
                "summary": "End specific attendance",
                "description": "",
                "operationId": "endAttendance",
                "parameters": [{
                        "name": "courseKey",
                        "in": "path",
                        "description": "Course key",
                        "required": true,
                        "type": "string"
                    },
                    {
                        "name": "attendanceId",
                        "in": "path",
                        "description": "Attendance Id",
                        "required": true,
                        "type": "integer",
                        "format": "int64"
                    }
                ],
                "responses": {
                    "default": {
                        "description": "successful operation"
                    }
                },
                "security": [{
                    "Bearer": []
                }]
            }
        },
        "/courses/{courseKey}/instructor/summary": {
            "get": {
                "tags": [
                    "attendance"
                ],
                "summary": "Get summary of attendances for courseKey",
                "description": "Instructor only",
                "operationId": "getCourseSummary",
                "produces": [
                    "application/json"
                ],
                "parameters": [{
                    "name": "courseKey",
                    "in": "path",
                    "description": "Course key",
                    "required": true,
                    "type": "string"
                }],
                "responses": {
                    "200": {
                        "description": "successful operation",
                        "schema": {
                            "$ref": "#/definitions/GatewayCourseSummary"
                        }
                    }
                },
                "security": [{
                    "Bearer": []
                }]
            }
        },
        "/courses/{courseKey}/polls/{pollId}": {
            "get": {
                "tags": [
                    "poll"
                ],
                "summary": "Get poll by id",
                "description": "",
                "operationId": "getPoll",
                "produces": [
                    "application/json"
                ],
                "parameters": [{
                        "name": "courseKey",
                        "in": "path",
                        "required": true,
                        "type": "string"
                    },
                    {
                        "name": "pollId",
                        "in": "path",
                        "required": true,
                        "type": "integer",
                        "format": "int64"
                    }
                ],
                "responses": {
                    "200": {
                        "description": "successful operation",
                        "schema": {
                            "$ref": "#/definitions/GatewayPoll"
                        }
                    }
                },
                "security": [{
                    "Bearer": []
                }]
            },
            "delete": {
                "tags": [
                    "poll"
                ],
                "summary": "Delete one poll",
                "description": "",
                "operationId": "deletePoll",
                "parameters": [{
                        "name": "courseKey",
                        "in": "path",
                        "required": true,
                        "type": "string"
                    },
                    {
                        "name": "pollId",
                        "in": "path",
                        "required": true,
                        "type": "integer",
                        "format": "int64"
                    }
                ],
                "responses": {
                    "default": {
                        "description": "successful operation"
                    }
                },
                "security": [{
                    "Bearer": []
                }]
            }
        },
        "/courses/{courseKey}/polls": {
            "get": {
                "tags": [
                    "poll"
                ],
                "summary": "Fetch all the polls for course",
                "description": "",
                "operationId": "getPolls",
                "produces": [
                    "application/json"
                ],
                "parameters": [{
                    "name": "courseKey",
                    "in": "path",
                    "required": true,
                    "type": "string"
                }],
                "responses": {
                    "200": {
                        "description": "successful operation",
                        "schema": {
                            "$ref": "#/definitions/GetGatewayPollsResponse"
                        }
                    }
                },
                "security": [{
                    "Bearer": []
                }]
            },
            "post": {
                "tags": [
                    "poll"
                ],
                "summary": "Create new poll",
                "description": "",
                "operationId": "createPoll",
                "consumes": [
                    "application/json"
                ],
                "produces": [
                    "application/json"
                ],
                "parameters": [{
                        "name": "courseKey",
                        "in": "path",
                        "required": true,
                        "type": "string"
                    },
                    {
                        "in": "body",
                        "name": "body",
                        "required": false,
                        "schema": {
                            "$ref": "#/definitions/GatewayCreatePollRequest"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "successful operation",
                        "schema": {
                            "$ref": "#/definitions/GatewayPoll"
                        }
                    }
                },
                "security": [{
                    "Bearer": []
                }]
            }
        },
        "/courses/{courseKey}/polls/{pollId}/outcomes/student": {
            "get": {
                "tags": [
                    "poll"
                ],
                "summary": "Fetch poll results for one poll",
                "description": "",
                "operationId": "getPollOutcomeForStudent",
                "produces": [
                    "application/json"
                ],
                "parameters": [{
                        "name": "courseKey",
                        "in": "path",
                        "required": true,
                        "type": "string"
                    },
                    {
                        "name": "pollId",
                        "in": "path",
                        "required": true,
                        "type": "integer",
                        "format": "int64"
                    }
                ],
                "responses": {
                    "200": {
                        "description": "successful operation",
                        "schema": {
                            "$ref": "#/definitions/GatewayPollOutcome"
                        }
                    }
                },
                "security": [{
                    "Bearer": []
                }]
            }
        },
        "/courses/{courseKey}/polls/{pollId}/end": {
            "post": {
                "tags": [
                    "poll"
                ],
                "summary": "End a poll",
                "description": "",
                "operationId": "endPoll",
                "produces": [
                    "application/json"
                ],
                "parameters": [{
                        "name": "courseKey",
                        "in": "path",
                        "required": true,
                        "type": "string"
                    },
                    {
                        "name": "pollId",
                        "in": "path",
                        "required": true,
                        "type": "integer",
                        "format": "int64"
                    }
                ],
                "responses": {
                    "default": {
                        "description": "successful operation"
                    }
                },
                "security": [{
                    "Bearer": []
                }]
            }
        },
        "/courses/{courseKey}/polls/{pollId}/outcomes/instructor": {
            "get": {
                "tags": [
                    "poll"
                ],
                "summary": "Fetch all polls results for poll id",
                "description": "",
                "operationId": "getPollOutcomeInstructor",
                "produces": [
                    "application/json"
                ],
                "parameters": [{
                        "name": "courseKey",
                        "in": "path",
                        "required": true,
                        "type": "string"
                    },
                    {
                        "name": "pollId",
                        "in": "path",
                        "required": true,
                        "type": "integer",
                        "format": "int64"
                    }
                ],
                "responses": {
                    "200": {
                        "description": "successful operation",
                        "schema": {
                            "$ref": "#/definitions/GatewayPollOutcome"
                        }
                    }
                },
                "security": [{
                    "Bearer": []
                }]
            }
        },
        "/courses/{courseKey}/polls/outcome": {
            "get": {
                "tags": [
                    "poll"
                ],
                "summary": "Fetch all polls results for course",
                "description": "",
                "operationId": "getPollsOutcomesForCourse",
                "produces": [
                    "application/json",
                    "text/csv"
                ],
                "parameters": [{
                        "name": "courseKey",
                        "in": "path",
                        "required": true,
                        "type": "string"
                    },
                    {
                        "name": "dateBefore",
                        "in": "query",
                        "description": "Top limit for poll date creation",
                        "required": false,
                        "type": "string",
                        "format": "date"
                    },
                    {
                        "name": "dateAfter",
                        "in": "query",
                        "description": "Bottom limit for poll date creation",
                        "required": false,
                        "type": "string",
                        "format": "date"
                    }
                ],
                "responses": {
                    "200": {
                        "description": "successful operation",
                        "schema": {
                            "$ref": "#/definitions/GetGatewayPollOutcomesResponse"
                        }
                    }
                },
                "security": [{
                    "Bearer": []
                }]
            }
        },
        "/courses/{courseKey}/polls/{pollId}/submit": {
            "post": {
                "tags": [
                    "poll"
                ],
                "summary": "Submit answers to one poll you are authorized to see. Currently you are only allowed to submit once per poll.",
                "description": "",
                "operationId": "userSubmitPoll",
                "consumes": [
                    "application/json"
                ],
                "produces": [
                    "application/json"
                ],
                "parameters": [{
                        "name": "courseKey",
                        "in": "path",
                        "required": true,
                        "type": "string"
                    },
                    {
                        "name": "pollId",
                        "in": "path",
                        "required": true,
                        "type": "integer",
                        "format": "int64"
                    },
                    {
                        "in": "body",
                        "name": "body",
                        "required": false,
                        "schema": {
                            "$ref": "#/definitions/GatewaySubmitPollRequest"
                        }
                    }
                ],
                "responses": {
                    "default": {
                        "description": "successful operation"
                    }
                },
                "security": [{
                    "Bearer": []
                }]
            }
        }
    }
};

const asyncRequestLayer = arb.createAsyncRequestBuilder(exampleRequestDefinitionJSON);

console.log("Making async request http...");
asyncRequestLayer.nodeHTTPGET({
    params: {
        sleep: 10
    }
}).then(response => {
    console.log('Http request with sleep param at 10 made successfully - > ', response);
});

const dataB = jsBeautify(jsonString,{ indent_size: 2, space_in_empty_paren: true });

fs.writeFile('swaggerToArb.json', dataB, (err) => {
    if (err) throw err;
    console.log('The file has been saved!');
});
