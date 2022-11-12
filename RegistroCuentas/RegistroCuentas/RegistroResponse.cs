using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RegistroCuentas
{
    public class RegistroResponse
    {
        public String Address { get; set; }
        public String PrivateKey { get; set; }
        public RegistroResponse(string address, string privateKey)
        {
            Address = address;
            PrivateKey = privateKey;
        }

    }
}
