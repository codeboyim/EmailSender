using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace EmailSender.Controllers
{
    public class HomeController : Controller
    {
        public ActionResult Index()
        {
            return View();
        }

        public JsonResult SendEmail()
        {

            return Json(null);
        }

        [HttpPost]
        public JsonResult UploadFiles()
        {
            List<string> files = new List<string>();
            foreach (string file in Request.Files)
            {
                HttpPostedFileBase hpf = Request.Files[file] as HttpPostedFileBase;
                if (hpf.ContentLength == 0)
                {
                    continue;
                }

                files.Add(file);
            }
            return Json(new { success = true, files = files.ToArray() });
        }
    }
}
