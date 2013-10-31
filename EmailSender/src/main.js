
define(["require", "./model", "./view"], function (require, EmailNotifierModel, EmailNotifierView) {
    var _emptyDiv = $("<div>");
    if (!String.prototype.isEmail) {
        String.prototype.isEmail = function () {
            var pattern = "^([A-Za-z0-9\\!\\#\\$\\%\\&\\\'\\*\\+\\-\\/\\=\\?\\^\\_\\`\\{\\}\\|\\~]+|\"([\\x01-\\x08\\x0B\\x0C\\x0E-\\x1F\\x21\\x23-\\x5B\\x5D-\\x7F]|\\\\[\\x0-\\x7F])*\")(\\.([A-Za-z0-9\\!\\#\\$\\%\\&\\\'\\*\\+\\-\\/\\=\\?\\^\\_\\`\\{\\}\\|\\~]+|\"([\\x01-\\x08\\x0B\\x0C\\x0E-\\x1F\\x21\\x23-\\x5B\\x5D-\\x7F]|\\\\[\\x0-\\x7F])*\"))*@([A-Za-z0-9]([A-Za-z0-9\\-]*[A-Za-z0-9])?(\\.[A-Za-z0-9]([A-Za-z0-9\\-]*[A-Za-z0-9])?)*|(1[0-9]{0,2}|2([0-4][0-9]?|5[0-4]?|[6-9])?|[3-9][0-9]?)(\\.(0|1[0-9]{0,2}|2([0-4][0-9]?|5[0-5]?|[6-9])?|[3-9][0-9]?)){2}\\.(1[0-9]{0,2}|2([0-4][0-9]?|5[0-4]?|[6-9])?|[3-9][0-9]?))$";
            var regex = new RegExp(pattern);
            return regex.test(this);
        }
    }
    return {
        serviceUri: require.toUrl("./EmailSender.asmx"),
        run: function ($ph, onError, vars) {
            ///<param name="$ph">Placeholder for view</param>
            this.vars = vars;
            this.view = new EmailNotifierView({ model: new EmailNotifierModel(), placeHolder: $ph, onError: onError });
            this.model = this.view.model;
            this.onError = onError ? onError : function (error) {
                throw error.message;
            };
        },
        setContent: function (emails, subject, body) {
            this.view.model.set({ "Emails": emails, "Subject": subject, "Body": body });
        },
        send: function (onSuccess, onComplete) {
            var self = this, msgs = [];
            var data = {
                "emails": this.model.get("Emails") || [],
                "subject": this.model.get("Subject") || "",
                "body": this.model.get("Body") || "",
                "attachmentIds": _.map(this.model.get("Attachments") || [], function (att) { return att.id }),
                "vars": this.vars
            };

            if (data.emails.length === 0) {
                msgs.push("You must enter Emails");
            }

            if (data.subject.length === 0) {
                msgs.push("You must enter Email Subject");
            }

            if (data.body.length === 0 || _emptyDiv.html(data.body).text().trim().length === 0) {
                msgs.push("You must enter Email Body");
            }

            if (msgs.length > 0) {
                this.onError({ "type": "warn", "message": msgs });
                if (onComplete) {
                    onComplete.call(this);
                }
                return;
            }

            $.ajax({
                type: "POST",
                url: this.serviceUri + "/Send",
                dataType: "json",
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify(data),
                success: function (resp, status, xhr) {
                    var d = resp && resp.d ? resp.d : resp;
                    if (d.result && d.result === "ok") {
                        if (onSuccess) {
                            onSuccess.apply(this);
                        }
                    }
                    else {
                        self.onError({ "type": "error", "message": d.SystemError });
                    }
                },
                error: function (xhr, status, error) {
                    self.onError({ "type": "error", "message": xhr.responseText });
                },
                complete: function () {
                    if (onComplete) {
                        onComplete.call(this);
                    }
                }
            });
        },
        clear: function () {
            this.model.clear();
        },
        addRecipient: function (email) {
            var emails = [];

            if (!email) {
                this.onError({ "type": "warn", "message": "Please add a valid Email address." });
                return false;
            }
            else if (!email.isEmail() && !confirm("The Email address maybe invalid.\r\nDo you want to continue?")) {
                return false;
            }


            if (this.model.get("Emails") && this.model.get("Emails").length > 0) {
                emails = _.clone(this.model.get("Emails"));
            }

            if (emails.indexOf(email) >= 0) {
                this.onError({ "type": "warn", "message": "Email exists" });
                return false;
            }
            else {
                emails.push(email);
                this.model.set({ "Emails": emails });
            }

            return true;
        },
        set_wsc: function (wsc) {
            if (this.view.get_wsc() !== wsc) {
                this.view.set_wsc(wsc);
            }
        }
    }
});