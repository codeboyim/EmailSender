//https://github.com/akzhan/jwysiwyg
//https://github.com/xoxco/jQuery-Tags-Input


define(["require", "backbone", "text!./EmailSender.htm", "jquery.tagsinput", "jquery.wysiwyg.link", "jquery.wysiwyg.colorpicker", "uploadify"], function (require) {
    var tmpl = arguments[2];

    return Backbone.View.extend({
        className: "eml-sender",
        template: _.template(tmpl),
        initialize: function (option) {
            var self = this;
            this.$el.html(this.template());
            this.onError = option && option.onError ? option.onError : function (error) { //error:{type:string, message:string}
                throw error.message;
            };

            if (!option || !option.placeHolder) {
                this.onError("you must specify a place holder for EmailNotifier");
            }

            option.placeHolder.append(this.$el);

            this.serviceUri = require.toUrl("./EmailSender.asmx");

            _.bindAll(this, "render", "modelChanged", "upload_success", "upload_error",
                "tagRecipients_add", "tagRecipients_remove", "delete_attachment");
            this.model.bind("change", this.modelChanged);

            this.tagRecipients = this.$(".eml-sender-recipients");
            this.tagRecipients.tagsInput({
                "defaultText": "add an email",
                "width": this.tagRecipients.width(),
                "onAddTag": this.tagRecipients_add,
                "onRemoveTag": this.tagRecipients_remove
            });

            this.txtSubject = this.$(".eml-sender-subject");
            this.txtBody = this.$(".eml-sender-body").wysiwyg({
                initialContent: '',
                "controls": {
                    "insertImage": { visible: false },
                    "insertTable": { visible: false },
                    "code": { visible: false },
                    "html": { visible: true },
                    "colorpicker": {
                        visible: true,
                        css: {
                            "color": function (cssValue, Wysiwyg) {
                                var document = Wysiwyg.innerDocument(),
									defaultTextareaColor = $(document.body).css("color");

                                if (cssValue !== defaultTextareaColor) {
                                    return true;
                                }

                                return false;
                            }
                        },
                        exec: function () {
                            if ($.wysiwyg.controls.colorpicker) {
                                $.wysiwyg.controls.colorpicker.init(this);
                            }
                        },
                        tooltip: "Colorpicker"
                    },
                    "increaseFontSize": { visible: !$.browser.msie },
                    "decreaseFontSize": { visible: !$.browser.msie }
                }
            });

            this.listAttachments = this.$(".eml-sender-attachments");
            this.fileUpload = this.$(".eml-sender-upload");
            this.fileUpload.attr("id", this.fileUpload.parents("[id]:eq(0)").attr("id") + "eml_sender_upload");
            this.fileUpload.uploadify({
                "swf": require.toUrl("uploadify/../uploadify.swf"),
                "uploader": require.toUrl("home/UploadFiles"),
                "auto": true,
                "multi": true,
                "onUploadSuccess": this.upload_success,
                "onUploadError": this.upload_error
            });
            this.$(".eml-sender-upload ~ object").addClass("eml-sender-uploader");
        },
        events: {
            "click .eml-sender-attdel": "delete_attachment",
            "click .eml-sender-spell-check": "check_spell",
            "change .eml-sender-body, .eml-sender-subject": "txt_changed"
        },
        render: function () {
            return this;
        },
        modelChanged: function (attrs) {
            var self = this;

            if (attrs.hasChanged("Emails")) {
                this.tagRecipients.importTags((this.model.get("Emails") || []).join());
            }

            if (attrs.hasChanged("Subject")) {
                this.txtSubject.val(this.model.get("Subject") || "");
            }

            this.txtBody.wysiwyg("setContent", this.model.get("Body") || "");

            if (attrs.hasChanged("Attachments")) {
                this.listAttachments.html("");
                _.each(this.model.get("Attachments"), function (file, i) {
                    self.listAttachments.append(
                        "<li style='background-image:url(" + require.toUrl("images/filetypes/" + self.getFileExtension(file.type)) + ")'>"
                        + "<span class='eml-sender-attname'>" + (file.name || "") + "</span>"
                        + "<img data-id='" + (i + 1) + "' class='eml-sender-attdel' src='" + require.toUrl("images/del.gif") + "' title='Remove this attachment'/>"
                        + "</li>");
                });
            }
        },
        upload_success: function (file, data, response) {
            var attachments = [];

            if (this.model.get("Attachments") && this.model.get("Attachments").length > 0) {
                attachments = _.clone(this.model.get("Attachments"));
            }

            attachments.push({ "name": file.name, "type": file.type });
            this.model.set({ Attachments: attachments });
        },
        upload_error: function (file, errorCode, errorMsg, errorString) {

            this.onError({ "type": "error", "message": errorString });

        },
        check_spell: function (e) {

            if (!this.get_wsc()) {
                return false;
            }

            var target = $(e.target).attr("data-target");

            if (target === "subject") {
                if (this.txtSubject.attr("id") == "") {
                    this.txtSubject.attr("id", this.$el.parents("[id]").attr("id") + "_" + this.txtSubject.attr("uniqueID"));
                }
                this.get_wsc().setTextComponentId(this.txtSubject.attr("id"));
                this.get_wsc().checkTextComponent(this.txtSubject.attr("id"));
            }
            else if (target === "body") {
                if (this.txtBody.attr("id") == "") {
                    this.txtBody.attr("id", this.$el.parents("[id]").attr("id") + "_" + this.txtBody.attr("uniqueID"));
                }
                this.get_wsc().setTextComponentId(this.txtBody.attr("id"));
                this.get_wsc().checkTextComponent(this.txtBody.attr("id"));
            }
            else {
                return false;
            }
        },
        delete_attachment: function (e) {

            var $t = $(e.target),
                data = {},
                id = parseInt($t.attr("data-id")),
                atts = [];

            if (!confirm("You are going to remove this attachment from this email.\r\nDo you want to continue?")) {
                return;
            }

            if (this.model.get("Attachments") && this.model.get("Attachments").length > 0) {
                atts = _.clone(this.model.get("Attachments"));
            }

            //will call server to remove selected attachment, but here for simpliciy only to update the attachment list.
            if (atts && atts.length > 0) {

                atts.splice(id - 1, 1);
                this.model.set({ "Attachments": atts });
            }            
        },
        tagRecipients_add: function (email) {
            var emails;

            if (!email.isEmail() && !confirm("The Email address maybe invalid.\r\nDo you want to continue?")) {
                this.tagRecipients.removeTag(email);
                return false;
            }

            emails = this.model.get("Emails") || [];
            emails.push(email);
        },
        tagRecipients_remove: function (email) {
            var emails = this.model.get("Emails") || [];

            if (emails.indexOf(email) >= 0) {
                emails.splice(emails.indexOf(email), 1);
            }
        },
        txt_changed: function (e) {
            var $t = $(e.target);

            if ($t.hasClass("eml-sender-subject")) {
                this.model.set({ "Subject": $t.val().trim() }, { silent: true });
            }
            else if ($t.hasClass("eml-sender-body")) {
                this.model.set({ "Body": this.txtBody.wysiwyg("getContent") }, { silent: true });
            }
        },
        set_wsc: function (wsc) {
            if (this._wsc !== wsc) {
                this._wsc = wsc;
            }
        },
        get_wsc: function () {
            return this._wsc || null;
        },
        getFileExtension: function (name) {
            var name = name.toLowerCase();
            if (name.match("(.doc)|(.docx)$"))
                return "document-word.png";
            if (name.match("(.xls)|(.xlsx)$"))
                return "document-excel.png";
            if (name.match("(.jpg)|(.gif)|(.png)|(.bmp)$"))
                return "document-image.png";
            if (name.match(".txt$"))
                return "document-text.png";
            if (name.match("(.zip)|(.rar)$"))
                return "document-zipper.png";
            if (name.match(".pdf$"))
                return "document-pdf.png";
            if (name.match("(.mov)|(.mp4)|(.avi)|(.wmv)$"))
                return "document-film.png";
            if (name.match("(.mp3)|(.wav)$"))
                return "document-music.png";
            if (name.match("(.fla)|(.swf)$"))
                return "document-flash.png";
            if (name.match("xml$"))
                return "document-xml.png";
            return "document.png";
        }
    });
});