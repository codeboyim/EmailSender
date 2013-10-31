define(["backbone"], function () {
    return Backbone.Model.extend({
        defaults: {
            "Emails": [],
            "Subject": "",
            "Body": "",
            "Attachments": [] //{id:integer, name:string, type:.jpg|.doc|etc.}
        }
    });
});